const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const OTP = require('../models/OTP');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Nodemailer configuration error:', error);
  } else {
    console.log('Nodemailer is ready to send emails');
  }
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Food Paradise',
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}: OTP = ${otp}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i') });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,
      email: normalizedEmail,
      password,
    });

    await user.save();
    console.log(`User created: ${JSON.stringify({ id: user._id, email: normalizedEmail })}`);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name, email: normalizedEmail, height: user.height, weight: user.weight, goal: user.goal, avatar: user.avatar } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Login request:', {
      email: normalizedEmail,
      passwordLength: password.length,
      passwordPreview: `${password.slice(0, 1)}...${password.slice(-1)}`,
    });
    const user = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i') });
    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', { id: user._id, email: user.email });
    console.log('Stored password hash:', user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, height: user.height, weight: user.weight, goal: user.goal, avatar: user.avatar } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Forgot Password request for:', normalizedEmail);
    const user = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i') });
    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found for OTP:', { id: user._id, email: user.email });
    const otp = generateOTP();
    const otpRecord = new OTP({ email: normalizedEmail, otp });
    await otpRecord.save();
    console.log(`OTP saved to DB: ${JSON.stringify(otpRecord)}`);
    await sendOTPEmail(normalizedEmail, otp);

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Forgot Password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('Verify OTP request:', { email: normalizedEmail, otp, otpType: typeof otp });

    const otpRecord = await OTP.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i'), otp });
    console.log('OTP record from DB:', otpRecord);

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and newPassword are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('Reset Password request:', {
      email: normalizedEmail,
      otp,
      newPasswordLength: newPassword.length,
      newPasswordPreview: `${newPassword.slice(0, 1)}...${newPassword.slice(-1)}`,
    });

    const otpRecord = await OTP.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i'), otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i') });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found for reset:', { id: user._id, email: user.email });
    user.password = newPassword;
    await user.save();
    console.log(`Password updated for user: ${normalizedEmail}, id: ${user._id}`);

    await OTP.deleteOne({ email: normalizedEmail, otp });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/test-otp', async (req, res) => {
  try {
    const { email } = req.query;
    const normalizedEmail = email.toLowerCase().trim();
    const otps = await OTP.find({ email: new RegExp(`^${normalizedEmail}$`, 'i') });
    res.json({ otps });
  } catch (error) {
    console.error('Test OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;