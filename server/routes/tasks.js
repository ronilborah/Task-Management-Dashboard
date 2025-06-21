const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Get all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get tasks by project
router.get('/project/:projectId', async (req, res) => {
    try {
        const tasks = await Task.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new task
router.post('/', async (req, res) => {
    try {
        const { title, description, status, priority, projectId, assignee, dueDate } = req.body;

        if (!title || !projectId) {
            return res.status(400).json({ message: 'Title and projectId are required' });
        }

        const task = new Task({
            title,
            description,
            status,
            priority,
            projectId,
            assignee,
            dueDate,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a task
router.put('/:id', async (req, res) => {
    try {
        const updateData = { ...req.body, updatedAt: new Date() };
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a task
router.delete('/:id', async (req, res) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);

        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete all tasks for a project
router.delete('/project/:projectId', async (req, res) => {
    try {
        await Task.deleteMany({ projectId: req.params.projectId });
        res.json({ message: 'All tasks for project deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
