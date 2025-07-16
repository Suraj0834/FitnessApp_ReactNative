const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Workout = require('../models/Workout');

router.post('/', auth, async (req, res) => {
  const { value, date } = req.body;
  try {
    const workout = new Workout({
      userId: req.user.userId,
      value,
      date,
    });
    await workout.save();
    res.json(workout);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.user.userId });
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;