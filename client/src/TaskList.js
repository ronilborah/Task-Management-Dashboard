import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

const statusColors = {
    "pending": "#a5b4fc",
    "in progress": "#fbbf24",
    "completed": "#86efac"
};
const priorityColors = {
    "high": "#fca5a5",
    "medium": "#fde68a",
    "low": "#a7f3d0"
};

const backgroundThemes = {
    "white": "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    "cream": "linear-gradient(135deg, #fefefe 0%, #f7f3f0 100%)",
    "blue": "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    "purple": "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
    "green": "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    "dark": "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
};

const getSuggestedTask = (tasks) => {
    if (!tasks.length) return null;
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const pendingTasks = tasks.filter((t) => t.status === "pending" && !t.completed);
    if (!pendingTasks.length) return null;
    pendingTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    return pendingTasks[0];
};

function TaskList() {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [dueDate, setDueDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [editId, setEditId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [dark, setDark] = useState(false);
    const [backgroundTheme, setBackgroundTheme] = useState("white");
    const [sortBy, setSortBy] = useState("priority");

    useEffect(() => {
        document.body.className = dark ? "dark" : "";
        document.body.style.background = dark ? backgroundThemes.dark : backgroundThemes[backgroundTheme];
    }, [dark, backgroundTheme]);

    const fetchTasks = () => {
        fetch("http://localhost:8000/api/tasks")
            .then((res) => res.json())
            .then((data) => setTasks(data))
            .catch((err) => {
                console.error("Failed to fetch tasks:", err);
                toast.error("Failed to fetch tasks");
            });
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }
        try {
            const res = await fetch("http://localhost:8000/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, priority, dueDate, completed: false }),
            });
            if (!res.ok) throw new Error("Failed to add task");
            setTitle("");
            setDescription("");
            setPriority("medium");
            setDueDate(new Date().toISOString().split("T")[0]);
            fetchTasks();
            toast.success("Task added successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Error adding task");
        }
    };

    const updateTask = async (id, field, value) => {
        try {
            const task = tasks.find((t) => t._id === id);
            const updatedTask = { ...task, [field]: value };
            const res = await fetch(`http://localhost:8000/api/tasks/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedTask),
            });
            if (!res.ok) throw new Error("Failed to update task");
            fetchTasks();
            toast.success("Task updated");
        } catch (error) {
            console.error(error);
            toast.error("Error updating task");
        }
    };

    const deleteTask = async (id) => {
        try {
            const res = await fetch(`http://localhost:8000/api/tasks/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete task");
            fetchTasks();
            toast.success("Task deleted");
        } catch (error) {
            console.error(error);
            toast.error("Error deleting task");
        }
    };

    const toggleComplete = async (task) => {
        await updateTask(task._id, "completed", !task.completed);
    };

    const sortTasks = (taskArray) => {
        const sorted = [...taskArray];
        if (sortBy === "priority") {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        } else if (sortBy === "dueDate") {
            sorted.sort((a, b) => new Date(a.dueDate || "9999-12-31") - new Date(b.dueDate || "9999-12-31"));
        }

        // Always put completed tasks at the bottom
        return [
            ...sorted.filter((t) => !t.completed && t.status !== "completed"),
            ...sorted.filter((t) => t.completed || t.status === "completed"),
        ];
    };

    const highPriority = sortTasks(tasks.filter((t) => t.priority === "high"));
    const mediumPriority = sortTasks(tasks.filter((t) => t.priority === "medium"));
    const lowPriority = sortTasks(tasks.filter((t) => t.priority === "low"));

    const suggestedTask = getSuggestedTask(tasks);

    const TaskColumn = ({ title, color, tasks }) => (
        <div className={`task-column ${dark ? "dark" : ""}`}>
            <div className="column-header" style={{ borderBottom: `2px solid ${color}` }}>
                <h3 style={{ color }}>{title}</h3>
                <span className="task-count">{tasks.length}</span>
            </div>
            {tasks.length === 0 ? (
                <p className="no-tasks">No tasks</p>
            ) : (
                <ul className="task-list">
                    {tasks.map((task) => (
                        <li
                            key={task._id}
                            className={`task-card ${dark ? "dark" : ""} ${task.completed ? "completed" : ""}`}
                        >
                            <div className="task-main-row">
                                <div className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={task.completed || false}
                                        onChange={() => toggleComplete(task)}
                                        className="task-checkbox"
                                        id={`task-${task._id}`}
                                    />
                                    <label htmlFor={`task-${task._id}`} className="checkbox-label">
                                        <span className="checkmark">{task.completed ? '✅' : ''}</span>
                                    </label>
                                </div>
                                {editId === task._id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="task-input"
                                        />
                                        <button
                                            className="btn save"
                                            onClick={async () => {
                                                await updateTask(task._id, "title", editTitle);
                                                setEditId(null);
                                            }}
                                        >
                                            Save
                                        </button>
                                        <button className="btn cancel" onClick={() => setEditId(null)}>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className={`task-title ${task.completed ? "completed-text" : ""}`}>
                                            {task.title}
                                        </span>
                                        <div className="task-actions">
                                            <button
                                                className="btn edit"
                                                onClick={() => {
                                                    setEditId(task._id);
                                                    setEditTitle(task.title);
                                                    setEditDescription(task.description || "");
                                                    setEditDueDate(task.dueDate || "");
                                                }}
                                                title="Edit Task"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn delete"
                                                onClick={() => {
                                                    if (window.confirm("Are you sure you want to delete this task?")) {
                                                        deleteTask(task._id);
                                                    }
                                                }}
                                                title="Delete Task"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {(task.description || editId === task._id) && (
                                <div className="task-desc-row">
                                    {editId === task._id ? (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Description"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                className="task-input"
                                            />
                                            <input
                                                type="date"
                                                value={editDueDate ? editDueDate.split("T")[0] : ""}
                                                onChange={(e) => setEditDueDate(e.target.value)}
                                                className="task-input date-input"
                                            />
                                            <button
                                                className="btn save"
                                                onClick={async () => {
                                                    await updateTask(task._id, "description", editDescription);
                                                    await updateTask(task._id, "dueDate", editDueDate);
                                                    setEditId(null);
                                                }}
                                            >
                                                Save
                                            </button>
                                        </>
                                    ) : (
                                        <span className="task-desc">{task.description}</span>
                                    )}
                                </div>
                            )}

                            {task.dueDate && editId !== task._id && (
                                <div className="task-due-date">
                                    <input
                                        type="date"
                                        value={task.dueDate.split("T")[0]}
                                        onChange={(e) => updateTask(task._id, "dueDate", e.target.value)}
                                        className="inline-date-input"
                                    />
                                </div>
                            )}

                            <div className="task-meta-row">
                                <select
                                    value={task.status}
                                    onChange={(e) => updateTask(task._id, "status", e.target.value)}
                                    className="apple-select status-select"
                                    style={{ background: statusColors[task.status] }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <select
                                    value={task.priority}
                                    onChange={(e) => updateTask(task._id, "priority", e.target.value)}
                                    className="apple-select priority-select"
                                    style={{ background: priorityColors[task.priority] }}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className={`dashboard-container ${dark ? "dark" : ""}`}>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Tasks</h1>
                <div className="header-controls">
                    <select
                        value={backgroundTheme}
                        onChange={(e) => setBackgroundTheme(e.target.value)}
                        className="apple-select theme-select"
                    >
                        <option value="white">Clean White</option>
                        <option value="cream">Warm Cream</option>
                        <option value="blue">Soft Blue</option>
                        <option value="purple">Light Purple</option>
                        <option value="green">Fresh Green</option>
                    </select>
                    <button className="dark-toggle" onClick={() => setDark((d) => !d)}>
                        {dark ? "Light" : "Dark"}
                    </button>
                </div>
            </div>

            <div className="controls-section">
                <form className="add-task-form" onSubmit={handleAddTask}>
                    <input
                        type="text"
                        placeholder="Add a new task..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="title-input"
                    />
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="desc-input"
                    />
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="date-input"
                    />
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="apple-select priority-input"
                    >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                    </select>
                    <button type="submit" className="btn add">Add</button>
                </form>

                <div className="sort-controls">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="apple-select sort-select"
                    >
                        <option value="priority">Sort by Priority</option>
                        <option value="dueDate">Sort by Due Date</option>
                    </select>
                </div>
            </div>

            {suggestedTask && (
                <div className="ai-suggestion">
                    <span className="suggestion-text">
                        <strong>Suggested:</strong> {suggestedTask.title}
                    </span>
                </div>
            )}

            <div className="columns">
                <TaskColumn title="High Priority" color="#fca5a5" tasks={highPriority} />
                <TaskColumn title="Medium Priority" color="#fde68a" tasks={mediumPriority} />
                <TaskColumn title="Low Priority" color="#a7f3d0" tasks={lowPriority} />
            </div>

            <ToastContainer position="top-right" autoClose={2000} hideProgressBar />
        </div>
    );
}

export default TaskList;
