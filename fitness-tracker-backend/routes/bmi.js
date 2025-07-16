const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BMI = require('../models/BMI');

router.post('/', auth, async (req, res) => {
  const { bmi, timestamp } = req.body;
  try {
    const bmiRecord = new BMI({
      userId: req.user.userId,
      bmi,
      timestamp,
    });
    await bmiRecord.save();
    res.json(bmiRecord);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const bmiRecords = await BMI.find({ userId: req.user.userId });
    res.json(bmiRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;