const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import task routes
const taskRoutes = require('./routes/tasks');

// Use task routes
app.use('/api/tasks', taskRoutes);

// MongoDB connection (no deprecated options)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err));

// Basic route
app.get('/', (req, res) => {
    res.send('API is running');
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
