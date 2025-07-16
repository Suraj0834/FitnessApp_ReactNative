const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Step = require('../models/Step');

router.post('/', auth, async (req, res) => {
  const { value, date } = req.body;
  try {
    const step = new Step({
      userId: req.user.userId,
      value,
      date,
    });
    await step.save();
    res.json(step);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const steps = await Step.find({ userId: req.user.userId });
    res.json(steps);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;