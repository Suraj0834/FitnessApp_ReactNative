const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  height: { type: String, default: '175 cm' },
  weight: { type: String, default: '70 kg' },
  goal: { type: String, default: 'Muscle Gain' },
  joinDate: { type: String, default: new Date().toISOString() },
  avatar: { type: String, default: 'https://via.placeholder.com/130' },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    if (!this.password.startsWith('$2a$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);