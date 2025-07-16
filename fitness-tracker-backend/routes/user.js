const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Set your ngrok domain here (no trailing slash)
const NGROK_URL = process.env.NGROK_URL || 'https://807d6ae0117a.ngrok-free.app';

function fixAvatarUrl(avatar) {
  if (!avatar) return avatar;
  if (avatar.startsWith('http://localhost:8083')) {
    return avatar.replace('http://localhost:8083', NGROK_URL);
  }
  if (avatar.startsWith('http://127.0.0.1:8083')) {
    return avatar.replace('http://127.0.0.1:8083', NGROK_URL);
  }
  if (!avatar.startsWith('http') && !avatar.startsWith('https')) {
    // Remove any double slashes
    return NGROK_URL + (avatar.startsWith('/') ? '' : '/') + avatar;
  }
  return avatar;
}

const storage = multer.diskStorage({
  destination: './Uploads/',
  filename: (req, file, cb) => {
    cb(null, `${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG/PNG images are allowed'));
  },
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.avatar && user.avatar.startsWith('file://')) {
      console.warn('Invalid avatar URI in database:', user.avatar);
      user.avatar = 'https://via.placeholder.com/130';
    }
    user.avatar = fixAvatarUrl(user.avatar);
    console.log('Profile fetched:', { id: user._id, email: user.email, avatar: user.avatar });
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', auth, upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, height, weight, goal } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const updates = { 
      name, 
      email: email.toLowerCase().trim(), 
      height: height || '175 cm', 
      weight: weight || '70 kg', 
      goal: goal || 'Muscle Gain' 
    };
    if (req.file) {
      updates.avatar = `/Uploads/${req.file.filename}`;
      console.log('Image uploaded:', updates.avatar);
    }
    const user = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.avatar && user.avatar.startsWith('file://')) {
      console.warn('Invalid avatar URI saved to database:', user.avatar);
      user.avatar = 'https://via.placeholder.com/130';
    }
    user.avatar = fixAvatarUrl(user.avatar);
    console.log('Profile updated:', { id: user._id, email: user.email, avatar: user.avatar });
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;