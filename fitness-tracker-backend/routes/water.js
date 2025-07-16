const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WaterIntake = require('../models/WaterIntake');

router.post('/', auth, async (req, res) => {
  const { value, date } = req.body;
  try {
    const waterIntake = new WaterIntake({
      userId: req.user.userId,
      value,
      date,
    });
    await waterIntake.save();
    res.json(waterIntake);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const waterIntakes = await WaterIntake.find({ userId: req.user.userId });
    res.json(waterIntakes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;