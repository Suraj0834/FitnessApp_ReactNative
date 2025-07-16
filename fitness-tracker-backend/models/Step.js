const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true },
  date: { type: String, required: true },
});

module.exports = mongoose.model('Step', stepSchema);