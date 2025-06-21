import React, { useState } from "react";
import axios from "axios";

function TaskForm({ onTaskAdded }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");

    const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;

        try {
            await axios.post(`${API_BASE_URL}/api/tasks`, {
                title,
                description,
                priority,
            });
            setTitle("");
            setDescription("");
            setPriority("medium");
            onTaskAdded(); // Refresh the task list
        } catch (err) {
            alert("Error adding task");
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
            <input
                type="text"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
            <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
            >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
            <button type="submit">Add Task</button>
        </form>
    );
}

export default TaskForm;
