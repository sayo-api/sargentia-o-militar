const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    soldiers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        duty: {
          type: String,
          default: 'Serviço',
          trim: true,
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Index for fast date queries
scheduleSchema.index({ date: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
