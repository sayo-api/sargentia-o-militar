const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// @route GET /api/notices
// @desc Get all active notices
router.get('/', protect, async (req, res) => {
  try {
    const notices = await Notice.find({ active: true })
      .populate('createdBy', 'warName rank')
      .sort({ pinned: -1, createdAt: -1 });

    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar avisos.' });
  }
});

// @route GET /api/notices/all
// @desc Get all notices including inactive (admin)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('createdBy', 'warName rank')
      .sort({ pinned: -1, createdAt: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar avisos.' });
  }
});

// @route GET /api/notices/:id
// @desc Get single notice and mark as read
router.get('/:id', protect, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('createdBy', 'warName rank')
      .populate('readBy', 'warName warNumber');

    if (!notice) return res.status(404).json({ message: 'Aviso não encontrado.' });

    // Mark as read
    if (!notice.readBy.some((u) => u._id.toString() === req.user._id.toString())) {
      notice.readBy.push(req.user._id);
      await notice.save();
    }

    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar aviso.' });
  }
});

// @route POST /api/notices
// @desc Create notice (admin) with optional file uploads
router.post(
  '/',
  protect,
  adminOnly,
  upload.array('attachments', 10),
  async (req, res) => {
    try {
      const { title, content, priority, pinned } = req.body;

      const attachments = (req.files || []).map((file) => {
        let type = 'other';
        if (file.mimetype.startsWith('image/gif')) type = 'gif';
        else if (file.mimetype.startsWith('image/')) type = 'image';
        else if (file.mimetype.startsWith('video/')) type = 'video';
        else if (file.mimetype === 'application/pdf') type = 'pdf';
        else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel') || file.originalname.match(/\.(xlsx|xls|csv)$/i)) type = 'spreadsheet';

        return {
          url: file.path,
          publicId: file.filename,
          type,
          name: file.originalname,
          size: file.size,
        };
      });

      const notice = await Notice.create({
        title,
        content,
        priority: priority || 'normal',
        pinned: pinned === 'true' || pinned === true,
        attachments,
        createdBy: req.user._id,
      });

      await notice.populate('createdBy', 'warName rank');
      res.status(201).json(notice);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao criar aviso.' });
    }
  }
);

// @route PUT /api/notices/:id
// @desc Update notice (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { title, content, priority, active, pinned } = req.body;
    const notice = await Notice.findById(req.params.id);

    if (!notice) return res.status(404).json({ message: 'Aviso não encontrado.' });

    if (title) notice.title = title;
    if (content) notice.content = content;
    if (priority) notice.priority = priority;
    if (typeof active === 'boolean') notice.active = active;
    if (typeof pinned === 'boolean') notice.pinned = pinned;

    await notice.save();
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar aviso.' });
  }
});

// @route DELETE /api/notices/:id
// @desc Delete notice (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Aviso removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover aviso.' });
  }
});

module.exports = router;
