const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role:        { type: String, enum: ['user', 'assistant'], required: true },
  content:     { type: String, required: true },
  imageBase64: { type: String, default: null },
  imageMime:   { type: String, default: null },
  isError:     { type: Boolean, default: false },
  searchUsed:  { type: Boolean, default: false },
  searchQueries: [String],
  thinking:    { type: String, default: null },
  timestamp:   { type: Date, default: Date.now },
});

const ChatSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, default: 'Nova Conversa' },
  messages: [MessageSchema],
}, { timestamps: true });

ChatSchema.pre('save', function (next) {
  if (this.title === 'Nova Conversa' && this.messages.length > 0) {
    const first = this.messages.find(m => m.role === 'user');
    if (first) {
      this.title = first.content.slice(0, 65) + (first.content.length > 65 ? '…' : '');
    }
  }
  next();
});

module.exports = mongoose.model('Chat', ChatSchema);
