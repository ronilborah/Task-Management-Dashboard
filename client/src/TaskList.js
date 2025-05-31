import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
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

const taskTemplates = [
    { title: "Daily Standup", description: "Team sync meeting", priority: "medium", category: "Meeting" },
    { title: "Code Review", description: "Review pull requests", priority: "high", category: "Development" },
    { title: "Documentation", description: "Update project docs", priority: "low", category: "Development" },
    { title: "Client Call", description: "Weekly client check-in", priority: "high", category: "Meeting" },
    { title: "Bug Fix", description: "Fix reported issues", priority: "high", category: "Development" }
];

const categories = ['Work', 'Personal', 'Urgent', 'Meeting', 'Development', 'Research'];

// Enhanced AI suggestion with due date consideration
const getEnhancedSuggestedTask = (tasks) => {
    if (!tasks.length) return null;

    const now = new Date();
    const pendingTasks = tasks.filter((t) => t.status === "pending");

    if (!pendingTasks.length) return null;

    const scoredTasks = pendingTasks.map(task => {
        let score = 0;

        if (task.priority === "high") score += 3;
        else if (task.priority === "medium") score += 2;
        else score += 1;

        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

            if (daysUntilDue <= 0) score += 5;
            else if (daysUntilDue <= 1) score += 3;
            else if (daysUntilDue <= 3) score += 2;
            else if (daysUntilDue <= 7) score += 1;
        }

        return { ...task, aiScore: score };
    });

    return scoredTasks.sort((a, b) => b.aiScore - a.aiScore)[0];
};

// Task Progress Bar Component
const TaskProgressBar = ({ tasks }) => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return (
        <div className="progress-container">
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <span className="progress-text">{Math.round(percentage)}% Complete ({completed}/{total})</span>
        </div>
    );
};

// Task Statistics Component
const TaskStats = ({ tasks }) => {
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status !== "completed").length;
    const overdue = tasks.filter(t => {
        if (!t.dueDate || t.status === "completed") return false;
        return new Date(t.dueDate) < new Date();
    }).length;

    return (
        <div className="task-stats">
            <div className="stat">
                <span className="stat-number">{completed}</span>
                <span className="stat-label">Completed</span>
            </div>
            <div className="stat">
                <span className="stat-number">{pending}</span>
                <span className="stat-label">Pending</span>
            </div>
            <div className="stat">
                <span className="stat-number">{overdue}</span>
                <span className="stat-label">Overdue</span>
            </div>
        </div>
    );
};

// Productivity Insights Component
const ProductivityInsights = ({ tasks }) => {
    const today = new Date().toDateString();
    const completedToday = tasks.filter(t =>
        t.status === 'completed' &&
        t.updatedAt && new Date(t.updatedAt).toDateString() === today
    ).length;

    const thisWeek = tasks.filter(t => {
        if (t.status !== 'completed' || !t.updatedAt) return false;
        const taskDate = new Date(t.updatedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return taskDate >= weekAgo;
    }).length;

    return (
        <div className="insights-panel">
            <h4> Productivity Insights</h4>
            <div className="insight-item">
                <span> Today: {completedToday} tasks</span>
            </div>
            <div className="insight-item">
                <span> This week: {thisWeek} tasks</span>
            </div>
            <div className="insight-item">
                <span> Success rate: {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%</span>
            </div>
        </div>
    );
};

function TaskList() {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [category, setCategory] = useState("");
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
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [savedFilters, setSavedFilters] = useState([]);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [timeTracking, setTimeTracking] = useState({});
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        document.body.className = dark ? "dark" : "";
        document.body.style.background = dark ? backgroundThemes.dark : backgroundThemes[backgroundTheme];
    }, [dark, backgroundTheme]);

    // Request notification permission
    useEffect(() => {
        if (Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                setNotificationsEnabled(permission === "granted");
            });
        } else {
            setNotificationsEnabled(Notification.permission === "granted");
        }
    }, []);

    // Task notifications
    useEffect(() => {
        if (!notificationsEnabled) return;

        const checkDueTasks = () => {
            const dueSoon = tasks.filter(task => {
                if (!task.dueDate || task.status === 'completed') return false;
                const dueDate = new Date(task.dueDate);
                const now = new Date();
                const timeDiff = dueDate - now;
                return timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000;
            });

            dueSoon.forEach(task => {
                new Notification(`Task Due Soon: ${task.title}`, {
                    body: `Due: ${new Date(task.dueDate).toLocaleDateString()}`,
                    icon: '/favicon.ico'
                });
            });
        };

        const interval = setInterval(checkDueTasks, 300000); // Check every 5 minutes
        return () => clearInterval(interval);
    }, [tasks, notificationsEnabled]);

    // Auto-save draft
    useEffect(() => {
        const draftData = { title, description, priority, dueDate, category };
        localStorage.setItem('taskDraft', JSON.stringify(draftData));
    }, [title, description, priority, dueDate, category]);

    // Load draft on mount
    useEffect(() => {
        const draft = localStorage.getItem('taskDraft');
        if (draft) {
            const { title, description, priority, dueDate, category } = JSON.parse(draft);
            setTitle(title || '');
            setDescription(description || '');
            setPriority(priority || 'medium');
            setDueDate(dueDate || new Date().toISOString().split("T")[0]);
            setCategory(category || '');
        }
    }, []);

    // Enhanced keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        document.querySelector('.title-input')?.focus();
                        break;
                    case 'd':
                        e.preventDefault();
                        setDark(d => !d);
                        break;
                    case 'f':
                        e.preventDefault();
                        document.querySelector('.search-input')?.focus();
                        break;
                    case 'a':
                        e.preventDefault();
                        setSelectedTasks(tasks.map(t => t._id));
                        break;
                    case 'e':
                        e.preventDefault();
                        exportTasks();
                        break;
                    case '1':
                        e.preventDefault();
                        setPriority('high');
                        break;
                    case '2':
                        e.preventDefault();
                        setPriority('medium');
                        break;
                    case '3':
                        e.preventDefault();
                        setPriority('low');
                        break;
                }
            }

            if (e.key === 'Escape') {
                setSelectedTasks([]);
                setEditId(null);
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [tasks]);

    const fetchTasks = () => {
        setLoading(true);
        fetch("http://localhost:8000/api/tasks")
            .then((res) => res.json())
            .then((data) => {
                setTasks(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch tasks:", err);
                toast.error("Failed to fetch tasks");
                setLoading(false);
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
                body: JSON.stringify({
                    title,
                    description,
                    priority,
                    dueDate,
                    category,
                    createdAt: new Date().toISOString()
                }),
            });
            if (!res.ok) throw new Error("Failed to add task");
            setTitle("");
            setDescription("");
            setPriority("medium");
            setCategory("");
            setDueDate(new Date().toISOString().split("T")[0]);
            localStorage.removeItem('taskDraft');
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
            const updatedTask = {
                ...task,
                [field]: value,
                updatedAt: new Date().toISOString()
            };
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

    // Bulk actions
    const bulkDelete = () => {
        if (window.confirm(`Delete ${selectedTasks.length} selected tasks?`)) {
            selectedTasks.forEach(id => deleteTask(id));
            setSelectedTasks([]);
        }
    };

    const bulkUpdateStatus = (status) => {
        selectedTasks.forEach(id => updateTask(id, 'status', status));
        setSelectedTasks([]);
        toast.success(`Updated ${selectedTasks.length} tasks to ${status}`);
    };

    const bulkUpdatePriority = (priority) => {
        selectedTasks.forEach(id => updateTask(id, 'priority', priority));
        setSelectedTasks([]);
        toast.success(`Updated ${selectedTasks.length} tasks to ${priority} priority`);
    };

    // Time tracking
    const startTimer = (taskId) => {
        setTimeTracking(prev => ({
            ...prev,
            [taskId]: { startTime: Date.now(), isRunning: true }
        }));
        toast.success("Timer started!");
    };

    const stopTimer = (taskId) => {
        setTimeTracking(prev => {
            const current = prev[taskId];
            if (current && current.isRunning) {
                const timeSpent = Date.now() - current.startTime;
                toast.success(`Timer stopped! Time: ${Math.round(timeSpent / 60000)} minutes`);
                return {
                    ...prev,
                    [taskId]: {
                        ...current,
                        isRunning: false,
                        totalTime: (current.totalTime || 0) + timeSpent
                    }
                };
            }
            return prev;
        });
    };

    const formatTime = (milliseconds) => {
        const minutes = Math.floor(milliseconds / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    };

    // Template application
    const applyTemplate = (templateIndex) => {
        if (templateIndex === "") return;
        const template = taskTemplates[templateIndex];
        setTitle(template.title);
        setDescription(template.description);
        setPriority(template.priority);
        setCategory(template.category);
        toast.success(`Applied template: ${template.title}`);
    };

    // Drag and Drop Handler
    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        const newPriority = destination.droppableId.replace('column-', '');
        const taskId = draggableId.replace('task-', '');

        await updateTask(taskId, 'priority', newPriority);
        toast.success(`Task moved to ${newPriority} priority!`);
    };

    const handleDelete = (task) => {
        if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
            deleteTask(task._id);
        }
    };

    const exportTasks = () => {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tasks.json';
        link.click();
        toast.success("Tasks exported successfully!");
    };

    // Advanced filtering logic
    const getFilteredTasks = () => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (task.description || "").toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filterStatus === "all" || task.status === filterStatus;
            const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
            const matchesCategory = filterCategory === "all" || task.category === filterCategory;

            let matchesDate = true;
            if (dateFilter === "custom" && startDate && endDate && task.dueDate) {
                const taskDate = new Date(task.dueDate);
                const start = new Date(startDate);
                const end = new Date(endDate);
                matchesDate = taskDate >= start && taskDate <= end;
            } else if (dateFilter === "today" && task.dueDate) {
                const today = new Date().toDateString();
                const taskDate = new Date(task.dueDate).toDateString();
                matchesDate = today === taskDate;
            } else if (dateFilter === "week" && task.dueDate) {
                const now = new Date();
                const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const taskDate = new Date(task.dueDate);
                matchesDate = taskDate >= now && taskDate <= weekFromNow;
            } else if (dateFilter === "overdue" && task.dueDate) {
                matchesDate = new Date(task.dueDate) < new Date() && task.status !== "completed";
            }

            return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDate;
        });
    };

    const saveCurrentFilter = () => {
        const filterName = prompt("Enter a name for this filter preset:");
        if (filterName) {
            const newFilter = {
                id: Date.now(),
                name: filterName,
                searchTerm,
                filterStatus,
                filterPriority,
                filterCategory,
                dateFilter,
                startDate,
                endDate
            };
            setSavedFilters([...savedFilters, newFilter]);
            toast.success("Filter preset saved!");
        }
    };

    const applySavedFilter = (filter) => {
        setSearchTerm(filter.searchTerm);
        setFilterStatus(filter.filterStatus);
        setFilterPriority(filter.filterPriority);
        setFilterCategory(filter.filterCategory);
        setDateFilter(filter.dateFilter);
        setStartDate(filter.startDate);
        setEndDate(filter.endDate);
        toast.success(`Applied filter: ${filter.name}`);
    };

    const clearAllFilters = () => {
        setSearchTerm("");
        setFilterStatus("all");
        setFilterPriority("all");
        setFilterCategory("all");
        setDateFilter("all");
        setStartDate("");
        setEndDate("");
        toast.success("All filters cleared!");
    };

    const filteredTasks = getFilteredTasks();

    const sortTasks = (taskArray) => {
        const sorted = [...taskArray];
        if (sortBy === "priority") {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        } else if (sortBy === "dueDate") {
            sorted.sort((a, b) => new Date(a.dueDate || "9999-12-31") - new Date(b.dueDate || "9999-12-31"));
        }

        return [
            ...sorted.filter((t) => t.status !== "completed"),
            ...sorted.filter((t) => t.status === "completed"),
        ];
    };

    const highPriority = sortTasks(filteredTasks.filter((t) => t.priority === "high"));
    const mediumPriority = sortTasks(filteredTasks.filter((t) => t.priority === "medium"));
    const lowPriority = sortTasks(filteredTasks.filter((t) => t.priority === "low"));

    const suggestedTask = getEnhancedSuggestedTask(tasks);

    const TaskColumn = ({ title, color, tasks, columnId }) => (
        <div className={`task-column ${dark ? "dark" : ""}`}>
            <div className="column-header" style={{ borderBottom: `2px solid ${color}` }}>
                <h3 style={{ color }}>{title}</h3>
                <span className="task-count">{tasks.length}</span>
            </div>
            <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`droppable-area ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                        {tasks.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📝</div>
                                <h4>No tasks yet</h4>
                                <p>Drag tasks here or create new ones</p>
                            </div>
                        ) : (
                            <ul className="task-list">
                                {tasks.map((task, index) => (
                                    <Draggable key={task._id} draggableId={`task-${task._id}`} index={index}>
                                        {(provided, snapshot) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`task-card ${dark ? "dark" : ""} ${task.status === "completed" ? "completed" : ""} ${snapshot.isDragging ? 'dragging' : ''} ${selectedTasks.includes(task._id) ? 'selected' : ''}`}
                                            >
                                                <div className="task-main-row">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTasks.includes(task._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedTasks([...selectedTasks, task._id]);
                                                            } else {
                                                                setSelectedTasks(selectedTasks.filter(id => id !== task._id));
                                                            }
                                                        }}
                                                        className="task-select-checkbox"
                                                    />
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
                                                            <span className="drag-handle">⋮⋮</span>
                                                            <span className={`task-title ${task.status === "completed" ? "completed-text" : ""}`}>
                                                                {task.title}
                                                            </span>
                                                            {task.category && (
                                                                <span className="category-tag">{task.category}</span>
                                                            )}
                                                            <div className="task-actions">
                                                                {timeTracking[task._id]?.isRunning ? (
                                                                    <button
                                                                        className="btn timer-btn stop"
                                                                        onClick={() => stopTimer(task._id)}
                                                                        title="Stop Timer"
                                                                    >
                                                                        ⏹️
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="btn timer-btn start"
                                                                        onClick={() => startTimer(task._id)}
                                                                        title="Start Timer"
                                                                    >
                                                                        ▶️
                                                                    </button>
                                                                )}
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
                                                                    onClick={() => handleDelete(task)}
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
                                                        {new Date(task.dueDate) < new Date() && task.status !== "completed" && (
                                                            <span className="overdue-badge">Overdue</span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Time tracking display */}
                                                {timeTracking[task._id] && (
                                                    <div className="time-tracking">
                                                        {timeTracking[task._id].isRunning && (
                                                            <span className="timer-running">⏱️ Timer running...</span>
                                                        )}
                                                        {timeTracking[task._id].totalTime && (
                                                            <span className="total-time">
                                                                Total: {formatTime(timeTracking[task._id].totalTime)}
                                                            </span>
                                                        )}
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
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                        )}
                    </div>
                )}
            </Droppable>
        </div>
    );

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className={`dashboard-container ${dark ? "dark" : ""}`}>
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Tasks</h1>
                    <div className="header-controls">
                        <button className="btn export" onClick={exportTasks} title="Export tasks">
                            Export
                        </button>
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

                <TaskStats tasks={tasks} />
                <TaskProgressBar tasks={tasks} />
                <ProductivityInsights tasks={tasks} />

                {/* Bulk Actions */}
                {selectedTasks.length > 0 && (
                    <div className="bulk-actions">
                        <span className="bulk-count">{selectedTasks.length} tasks selected</span>
                        <button className="btn bulk-btn" onClick={() => bulkUpdateStatus('completed')}>
                            Mark Complete
                        </button>
                        <button className="btn bulk-btn" onClick={() => bulkUpdateStatus('in progress')}>
                            Mark In Progress
                        </button>
                        <button className="btn bulk-btn" onClick={() => bulkUpdatePriority('high')}>
                            High Priority
                        </button>
                        <button className="btn bulk-btn delete" onClick={bulkDelete}>
                            Delete All
                        </button>
                        <button className="btn bulk-btn" onClick={() => setSelectedTasks([])}>
                            Clear Selection
                        </button>
                    </div>
                )}

                {/* Advanced Search and Filter Controls */}
                <div className="advanced-filters">
                    <div className="filter-row">
                        <input
                            type="text"
                            placeholder="Search tasks... (Ctrl+F)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="apple-select filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="apple-select filter-select"
                        >
                            <option value="all">All Priorities</option>
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="apple-select filter-select"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-row">
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="apple-select filter-select"
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Due Today</option>
                            <option value="week">Due This Week</option>
                            <option value="overdue">Overdue</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {dateFilter === "custom" && (
                            <>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="date-input"
                                    placeholder="Start Date"
                                />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="date-input"
                                    placeholder="End Date"
                                />
                            </>
                        )}

                        <button className="btn filter-action" onClick={saveCurrentFilter}>
                            Save Filter
                        </button>
                        <button className="btn filter-action" onClick={clearAllFilters}>
                            Clear All
                        </button>
                    </div>

                    {savedFilters.length > 0 && (
                        <div className="saved-filters">
                            <label>Saved Filters:</label>
                            {savedFilters.map(filter => (
                                <button
                                    key={filter.id}
                                    className="btn filter-preset"
                                    onClick={() => applySavedFilter(filter)}
                                >
                                    {filter.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="controls-section">
                    <form className="add-task-form" onSubmit={handleAddTask}>
                        <select
                            onChange={(e) => applyTemplate(e.target.value)}
                            className="apple-select template-select"
                            value=""
                        >
                            <option value="">Use Template</option>
                            {taskTemplates.map((template, index) => (
                                <option key={index} value={index}>{template.title}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Add a new task... (Ctrl+N)"
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
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="apple-select category-select"
                        >
                            <option value="">No Category</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
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

                {loading && (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading tasks...</p>
                    </div>
                )}

                {suggestedTask && (
                    <div className="ai-suggestion enhanced">
                        <span className="suggestion-icon">🤖</span>
                        <div className="suggestion-content">
                            <strong>AI Recommendation:</strong> Work on "{suggestedTask.title}"
                            <div className="suggestion-reason">
                                Priority: {suggestedTask.priority} • Score: {suggestedTask.aiScore}
                                {suggestedTask.dueDate && (
                                    <span> • Due: {new Date(suggestedTask.dueDate).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="drag-drop-info">
                    <small>💡 Tip: Drag tasks between columns to change priority levels</small>
                </div>

                <div className="keyboard-shortcuts">
                    <small>
                        Shortcuts: Ctrl+N (New) • Ctrl+D (Dark) • Ctrl+F (Search) • Ctrl+A (Select All) • Ctrl+E (Export) • Ctrl+1/2/3 (Priority)
                    </small>
                </div>

                <div className="columns">
                    <TaskColumn title="High Priority" color="#fca5a5" tasks={highPriority} columnId="column-high" />
                    <TaskColumn title="Medium Priority" color="#fde68a" tasks={mediumPriority} columnId="column-medium" />
                    <TaskColumn title="Low Priority" color="#a7f3d0" tasks={lowPriority} columnId="column-low" />
                </div>

                <ToastContainer position="top-right" autoClose={2000} hideProgressBar />
            </div>
        </DragDropContext>
    );
}

export default TaskList;
