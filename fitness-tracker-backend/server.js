require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const stepRoutes = require('./routes/steps');
const waterRoutes = require('./routes/water');
const workoutRoutes = require('./routes/workouts');
const bmiRoutes = require('./routes/bmi');
const connectDB = require('./config/connectDB');
const path = require('path');

const app = express();

connectDB();

app.use(express.json());
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/steps', stepRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/bmi', bmiRoutes);

const PORT = process.env.PORT || 8083;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));