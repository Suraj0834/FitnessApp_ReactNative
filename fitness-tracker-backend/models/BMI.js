const mongoose = require('mongoose');

const bmiSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bmi: { type: Number, required: true },
  timestamp: { type: String, required: true },
});

module.exports = mongoose.model('BMI', bmiSchema);