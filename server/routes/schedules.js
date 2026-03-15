const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const { protect, adminOnly } = require('../middleware/auth');

// @route GET /api/schedules
// @desc Get schedules (month/year filter)
router.get('/', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const schedules = await Schedule.find(query)
      .populate('soldiers.user', 'warNumber warName rank')
      .populate('createdBy', 'warName')
      .sort({ date: 1 });

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar escalas.' });
  }
});

// @route GET /api/schedules/my
// @desc Get logged-in soldier's schedule
router.get('/my', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    let dateQuery = {};

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      dateQuery = { $gte: start, $lte: end };
    }

    const schedules = await Schedule.find({
      'soldiers.user': req.user._id,
      ...(Object.keys(dateQuery).length ? { date: dateQuery } : {}),
    })
      .populate('soldiers.user', 'warNumber warName rank')
      .sort({ date: 1 });

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar sua escala.' });
  }
});

// @route POST /api/schedules
// @desc Create or update schedule for a date (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { date, soldiers, notes } = req.body;

    const dateObj = new Date(date);
    dateObj.setHours(12, 0, 0, 0);

    let schedule = await Schedule.findOne({
      date: {
        $gte: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
        $lt: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1),
      },
    });

    if (schedule) {
      schedule.soldiers = soldiers;
      schedule.notes = notes || '';
      await schedule.save();
    } else {
      schedule = await Schedule.create({
        date: dateObj,
        soldiers,
        notes: notes || '',
        createdBy: req.user._id,
      });
    }

    await schedule.populate('soldiers.user', 'warNumber warName rank');
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao salvar escala.' });
  }
});

// @route DELETE /api/schedules/:id
// @desc Delete a schedule (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Escala removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover escala.' });
  }
});

module.exports = router;
