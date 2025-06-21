import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./App.css";
import { PASTEL_COLORS } from "./ProjectList";

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

const PRIORITIES = [
    { label: "High", color: "priority-high" },
    { label: "Medium", color: "priority-medium" },
    { label: "Low", color: "priority-low" },
];

const STATUSES = [
    { label: "To Do", color: "status-todo" },
    { label: "In Progress", color: "status-inprogress" },
    { label: "Done", color: "status-done" },
];

const defaultTask = {
    title: "",
    description: "",
    dueDate: "",
    assignee: "",
    priority: "Medium",
    status: "To Do",
};

function getCounts(tasks) {
    const completed = tasks.filter((t) => t.status === "Done").length;
    const pending = tasks.filter((t) => t.status !== "Done").length;
    const overdue = tasks.filter(
        (t) =>
            t.dueDate &&
            t.status !== "Done" &&
            new Date(t.dueDate) < new Date(new Date().toDateString())
    ).length;
    return { completed, pending, overdue };
}

function TaskList({
    tasks,
    setTasks,
    selectedProjectId,
    projects,
    handleEdit,
    showAddTaskForm,
    setShowAddTaskForm,
    editId,
    setEditId,
    form,
    setForm,
    handleSubmit,
    handleChange,
}) {
    const [columnMode, setColumnMode] = useState("priority");

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const { draggableId, destination } = result;
        const destLabel = columns[destination.droppableId].label;
        setTasks((prev) =>
            prev.map((task) =>
                task.id === draggableId
                    ? columnMode === "priority"
                        ? { ...task, priority: destLabel }
                        : { ...task, status: destLabel }
                    : task
            )
        );
        toast.success(`Task moved to ${destLabel}`);
    };

    const handleDelete = (id) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        toast.success("Task deleted successfully!");
    };

    const handleComplete = (task) => {
        const newStatus = task.status === 'Done' ? 'To Do' : 'Done';
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, updatedAt: Date.now() } : t));
        toast.info(`Task marked as ${newStatus}`);
    }

    const filtered = tasks;

    // Columns and grouping logic
    const columns = columnMode === "priority" ? PRIORITIES : STATUSES;
    const byColumn = columns.reduce((acc, col) => {
        acc[col.label] = filtered.filter(
            (t) =>
                columnMode === "priority"
                    ? t.priority === col.label
                    : t.status === col.label
        );
        return acc;
    }, {});

    // Counts
    const { completed, pending, overdue } = getCounts(tasks);
    const allTasksForProject = selectedProjectId ? tasks.filter(t => t.projectId === selectedProjectId) : [];
    const totalTasks = allTasksForProject.length;
    const completedTasks = allTasksForProject.filter(t => t.status === 'Done').length;

    // Project info
    const project =
        projects && selectedProjectId
            ? projects.find((p) => p.id === selectedProjectId)
            : null;

    if (!selectedProjectId) {
        return (
            <div className="dashboard-main">
                <div className="empty-state" style={{ marginTop: '2rem' }}>
                    <div>No project selected</div>
                    <div className="empty-hint">
                        Please select a project from the sidebar to see tasks.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-main">
            <ToastContainer />

            <section className="counts-row">
                <div className="count-box">
                    <div className="count">{completedTasks}</div>
                    <div className="count-label">Completed</div>
                </div>
                <div className="count-box">
                    <div className="count">{totalTasks - completedTasks}</div>
                    <div className="count-label">Pending</div>
                </div>
                <div className="count-box">
                    <div className="count">{overdue}</div>
                    <div className="count-label">Overdue</div>
                </div>
            </section>

            {/* TOGGLE BUTTON */}
            <div style={{ textAlign: "left", margin: "20px 0" }}>
                <button
                    className="toggle-columns-btn"
                    onClick={() =>
                        setColumnMode((m) => (m === "priority" ? "status" : "priority"))
                    }
                >
                    View by: {columnMode === "priority" ? "Status" : "Priority"}
                </button>
            </div>

            <div className="tip-row">
                <span className="tip">
                    Tip: Drag tasks between columns to change {columnMode === "priority" ? "priority" : "status"} levels
                </span>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="priority-columns">
                    {columns.map((col, i) => (
                        <Droppable droppableId={String(i)} key={col.label}>
                            {(provided) => (
                                <div
                                    className={`priority-column ${col.color || ""}`}
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    <div className="priority-header">
                                        {col.label} {columnMode === "priority" ? "Priority" : ""}
                                        <span className="priority-count">
                                            {byColumn[col.label].length}
                                        </span>
                                    </div>
                                    <div className="priority-tasks">
                                        {byColumn[col.label].length === 0 ? (
                                            <div className="empty-state">
                                                <div>No tasks yet</div>
                                                <div className="empty-hint">
                                                    Drag tasks here or create new ones
                                                </div>
                                            </div>
                                        ) : (
                                            byColumn[col.label].map((task, idx) => (
                                                <Draggable
                                                    draggableId={task.id}
                                                    index={idx}
                                                    key={task.id}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            <TaskCard
                                                                task={task}
                                                                onDelete={handleDelete}
                                                                onEdit={handleEdit}
                                                                onComplete={handleComplete}
                                                                isEditing={editId === task.id}
                                                                form={form}
                                                                setForm={setForm}
                                                                handleSubmit={handleSubmit}
                                                                handleChange={handleChange}
                                                                setEditId={setEditId}
                                                                setShowAddTaskForm={setShowAddTaskForm}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))
                                        )}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}

const TaskCard = ({
    task,
    onDelete,
    onEdit,
    onComplete,
    isEditing,
    form,
    setForm,
    handleSubmit,
    handleChange,
    setEditId,
    setShowAddTaskForm,
}) => (
    <>
        <div
            className={`task-card ${task.status === "Done" ? "completed" : ""}`}
            tabIndex="0"
        >
            <div className="task-title">{task.title}</div>
            {task.description && <p className="task-body">{task.description}</p>}
            <div className="task-meta">
                <span>Status: {task.status}</span>
                {task.dueDate && <span>Due: {task.dueDate}</span>}
                {task.assignee && <span>To: {task.assignee}</span>}
            </div>
            <div className="task-actions">
                <button
                    onClick={() => onComplete(task)}
                    className="complete-btn"
                    aria-label="Complete task"
                >
                    &#10003;
                </button>
                <button
                    onClick={() => onEdit(task)}
                    className="edit-btn"
                    aria-label="Edit task"
                >
                    Edit
                </button>
                <button
                    onClick={() => onDelete(task.id)}
                    className="delete-btn"
                    aria-label="Delete task"
                >
                    Delete
                </button>
            </div>
        </div>
        {isEditing && (
            <form className="add-task-form" onSubmit={handleSubmit} style={{ marginTop: '0', marginBottom: '1rem' }}>
                <input
                    name="title"
                    placeholder="Task Title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    autoFocus
                />
                <input
                    name="description"
                    placeholder="Task Description"
                    value={form.description}
                    onChange={handleChange}
                />
                <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                >
                    {PRIORITIES.map((p) => (
                        <option key={p.label}>{p.label}</option>
                    ))}
                </select>
                <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                >
                    {STATUSES.map((s) => (
                        <option key={s.label}>{s.label}</option>
                    ))}
                </select>
                <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                />
                <input
                    name="assignee"
                    placeholder="Assignee"
                    value={form.assignee}
                    onChange={handleChange}
                />
                <button type="submit" className="add-btn">Update Task</button>
                <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                        setEditId(null);
                        setShowAddTaskForm(false);
                    }}
                >
                    Cancel
                </button>
            </form>
        )}
    </>
);

export default TaskList;
