const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// Helper: count services for a user in a date range
async function countUserServices(userId, startDate, endDate) {
  const query = { 'soldiers.user': userId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  return Schedule.countDocuments(query);
}

// Helper: get last service date for a user
async function getLastServiceDate(userId) {
  const last = await Schedule.findOne({ 'soldiers.user': userId })
    .sort({ date: -1 })
    .select('date');
  return last ? last.date : null;
}

// @route GET /api/stats/dashboard
// @desc Full dashboard stats
router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const weekStart = new Date(now);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    weekStart.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, totalSchedules, todaySchedule, weekSchedules] = await Promise.all([
      User.countDocuments({ role: 'soldier' }),
      User.countDocuments({ role: 'soldier', active: true }),
      Schedule.countDocuments(),
      Schedule.findOne({ date: { $gte: todayStart, $lt: todayEnd } })
        .populate('soldiers.user', 'warNumber warName rank'),
      Schedule.find({ date: { $gte: weekStart } })
        .populate('soldiers.user', 'warNumber warName rank')
        .sort({ date: 1 }),
    ]);

    // Services in last 30 days
    const recentSchedules = await Schedule.find({ date: { $gte: thirtyDaysAgo } })
      .populate('soldiers.user', 'warNumber warName rank');

    // Per-user stats (last 30 days)
    const userServiceMap = {};
    recentSchedules.forEach(sched => {
      sched.soldiers.forEach(s => {
        const uid = String(s.user?._id || s.user);
        if (!userServiceMap[uid]) {
          userServiceMap[uid] = {
            user: s.user,
            count: 0,
          };
        }
        userServiceMap[uid].count++;
      });
    });

    // Ranking sorted desc
    const ranking = Object.values(userServiceMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Waiting longest (active users not recently scheduled)
    const allActive = await User.find({ role: 'soldier', active: true }).select('_id warName rank warNumber');
    const waitingList = await Promise.all(
      allActive.map(async u => {
        const lastDate = await getLastServiceDate(u._id);
        const daysSince = lastDate
          ? Math.floor((now - lastDate) / 86400000)
          : 9999;
        return { user: u, lastDate, daysSince };
      })
    );
    waitingList.sort((a, b) => b.daysSince - a.daysSince);

    // Conflicts this week
    const conflicts = [];
    weekSchedules.forEach(sched => {
      const seen = {};
      sched.soldiers.forEach(s => {
        const uid = String(s.user?._id || s.user);
        if (seen[uid]) {
          conflicts.push({
            date: sched.date,
            user: s.user,
            duties: [seen[uid], s.duty],
          });
        } else {
          seen[uid] = s.duty;
        }
      });
    });

    res.json({
      totalUsers,
      activeUsers,
      totalSchedules,
      todaySchedule,
      weekSchedules,
      ranking,
      waitingList: waitingList.slice(0, 8),
      conflicts,
      recentCount: recentSchedules.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao carregar estatísticas.' });
  }
});

// @route GET /api/stats/ranking
// @desc Full ranking all users
router.get('/ranking', protect, adminOnly, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const allUsers = await User.find({ role: 'soldier' }).select('-password');
    const now = new Date();

    const result = await Promise.all(
      allUsers.map(async u => {
        const [total, recent] = await Promise.all([
          countUserServices(u._id),
          countUserServices(u._id, since),
        ]);
        const lastDate = await getLastServiceDate(u._id);
        const daysSince = lastDate ? Math.floor((now - lastDate) / 86400000) : 9999;
        return { user: u, total, recent, lastDate, daysSince };
      })
    );

    result.sort((a, b) => b.total - a.total);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao gerar ranking.' });
  }
});

// @route GET /api/stats/history/:userId
// @desc Service history for a specific user
router.get('/history/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { from, to, limit = 50 } = req.query;
    const query = { 'soldiers.user': req.params.userId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const schedules = await Schedule.find(query)
      .populate('soldiers.user', 'warName rank warNumber')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    const history = schedules.map(s => {
      const soldier = s.soldiers.find(
        sol => String(sol.user?._id || sol.user) === req.params.userId
      );
      return {
        _id: s._id,
        date: s.date,
        duty: soldier?.duty || 'Serviço',
        notes: s.notes,
      };
    });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar histórico.' });
  }
});

// @route GET /api/stats/conflicts
// @desc Detect scheduling conflicts
router.get('/conflicts', protect, adminOnly, async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = {};
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const schedules = await Schedule.find(query)
      .populate('soldiers.user', 'warName rank warNumber')
      .sort({ date: 1 });

    const conflicts = [];
    schedules.forEach(sched => {
      const seen = {};
      sched.soldiers.forEach(s => {
        const uid = String(s.user?._id || s.user);
        if (seen[uid]) {
          conflicts.push({
            date: sched.date,
            user: s.user,
            duty1: seen[uid],
            duty2: s.duty,
            scheduleId: sched._id,
          });
        } else {
          seen[uid] = s.duty;
        }
      });
    });

    // Check consecutive days
    const consecutiveWarnings = [];
    const userDateMap = {};
    schedules.forEach(sched => {
      sched.soldiers.forEach(s => {
        const uid = String(s.user?._id || s.user);
        if (!userDateMap[uid]) userDateMap[uid] = [];
        userDateMap[uid].push(new Date(sched.date));
      });
    });

    Object.entries(userDateMap).forEach(([uid, dates]) => {
      dates.sort((a, b) => a - b);
      for (let i = 1; i < dates.length; i++) {
        const diff = Math.floor((dates[i] - dates[i - 1]) / 86400000);
        if (diff === 1) {
          const sched = schedules.find(s => {
            const d = new Date(s.date);
            return d.toDateString() === dates[i].toDateString() &&
              s.soldiers.some(sol => String(sol.user?._id || sol.user) === uid);
          });
          const soldierInfo = sched?.soldiers.find(
            sol => String(sol.user?._id || sol.user) === uid
          );
          consecutiveWarnings.push({
            date: dates[i],
            prevDate: dates[i - 1],
            user: soldierInfo?.user,
            type: 'consecutive',
          });
        }
      }
    });

    res.json({ conflicts, consecutiveWarnings });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao verificar conflitos.' });
  }
});

// @route GET /api/stats/weekly
// @desc Weekly service counts (last N weeks)
router.get('/weekly', protect, adminOnly, async (req, res) => {
  try {
    const { weeks = 8 } = req.query;
    const result = [];
    const now = new Date();

    for (let w = parseInt(weeks) - 1; w >= 0; w--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (w + 1) * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      const count = await Schedule.countDocuments({ date: { $gte: start, $lt: end } });
      result.push({
        weekStart: start,
        weekEnd: end,
        count,
        label: `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}`,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar dados semanais.' });
  }
});

// @route POST /api/stats/auto-generate
// @desc Auto-generate schedule for a week
router.post('/auto-generate', protect, adminOnly, async (req, res) => {
  try {
    const { weekStart, duties } = req.body;
    // duties: array of duty type strings, e.g. ['Sgt do Dia','Cb Gda',...]

    const weekStartDate = new Date(weekStart);
    weekStartDate.setHours(0, 0, 0, 0);

    const activeUsers = await User.find({ role: 'soldier', active: true }).select('_id warName rank');
    if (activeUsers.length < 2) {
      return res.status(400).json({ message: 'Cadastre ao menos 2 militares ativos.' });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get recent service counts
    const recentSchedules = await Schedule.find({ date: { $gte: thirtyDaysAgo } });
    const serviceCounts = {};
    activeUsers.forEach(u => { serviceCounts[String(u._id)] = 0; });
    recentSchedules.forEach(s => {
      s.soldiers.forEach(sol => {
        const uid = String(sol.user);
        if (serviceCounts[uid] !== undefined) serviceCounts[uid]++;
      });
    });

    // Last service date per user
    const lastDates = {};
    for (const u of activeUsers) {
      const last = await getLastServiceDate(u._id);
      lastDates[String(u._id)] = last ? new Date(last) : null;
    }

    const generated = [];

    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + d);
      const dow = date.getDay();

      // Skip Sunday if not forced
      if (dow === 0 && !req.body.includeSunday) continue;

      // Score users: lower score = should work sooner
      // Higher days since last service = higher priority
      const sortedUsers = [...activeUsers].sort((a, b) => {
        const aId = String(a._id);
        const bId = String(b._id);
        const aLastDate = lastDates[aId];
        const bLastDate = lastDates[bId];
        const aDays = aLastDate ? Math.floor((date - aLastDate) / 86400000) : 9999;
        const bDays = bLastDate ? Math.floor((date - bLastDate) / 86400000) : 9999;
        const aScore = aDays - serviceCounts[aId] * 3;
        const bScore = bDays - serviceCounts[bId] * 3;
        return bScore - aScore; // Higher score first
      });

      const usedToday = new Set();
      // Check yesterday
      const yesterday = new Date(date);
      yesterday.setDate(date.getDate() - 1);
      const yesterdaySchedule = await Schedule.findOne({
        date: {
          $gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
          $lt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1),
        }
      });
      const usedYesterday = new Set();
      if (yesterdaySchedule) {
        yesterdaySchedule.soldiers.forEach(s => usedYesterday.add(String(s.user)));
      }

      const soldiers = [];
      const dutyList = duties || ['Sgt do Dia', 'Cb Gda', 'Cb do Dia', 'Plantão', 'Cb Hipismo'];

      for (const duty of dutyList) {
        const eligible = sortedUsers.filter(u => {
          const uid = String(u._id);
          return !usedToday.has(uid) && !usedYesterday.has(uid);
        });

        if (!eligible.length) {
          // Relax consecutive constraint
          const fallback = sortedUsers.filter(u => !usedToday.has(String(u._id)));
          if (fallback.length) {
            const chosen = fallback[0];
            usedToday.add(String(chosen._id));
            serviceCounts[String(chosen._id)]++;
            lastDates[String(chosen._id)] = date;
            soldiers.push({ user: chosen._id, duty });
          }
          continue;
        }

        const chosen = eligible[0];
        usedToday.add(String(chosen._id));
        serviceCounts[String(chosen._id)]++;
        lastDates[String(chosen._id)] = date;
        soldiers.push({ user: chosen._id, duty });
      }

      // Upsert schedule
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      let existing = await Schedule.findOne({ date: { $gte: dateStart, $lt: dateEnd } });
      if (existing) {
        existing.soldiers = soldiers;
        existing.notes = 'Gerado automaticamente pelo sistema';
        await existing.save();
        await existing.populate('soldiers.user', 'warName rank warNumber');
        generated.push(existing);
      } else {
        const sched = await Schedule.create({
          date,
          soldiers,
          notes: 'Gerado automaticamente pelo sistema',
          createdBy: req.user._id,
        });
        await sched.populate('soldiers.user', 'warName rank warNumber');
        generated.push(sched);
      }
    }

    res.json({ generated, count: generated.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao gerar escala automática.' });
  }
});

module.exports = router;
