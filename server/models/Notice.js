const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  type: {
    type: String,
    enum: ['image', 'video', 'pdf', 'spreadsheet', 'gif', 'document', 'other'],
    default: 'other',
  },
  name: { type: String },
  size: { type: Number },
});

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'importante', 'urgente'],
      default: 'normal',
    },
    attachments: [attachmentSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
