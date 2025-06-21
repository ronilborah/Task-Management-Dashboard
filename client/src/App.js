import React, { useState, useEffect } from "react";
import "./App.css";
import ProjectList from "./ProjectList";
import TaskList from "./TaskList";
import DarkModeToggle from "./DarkModeToggle";
import { toast } from "react-toastify";

const PRIORITIES = [
  { label: "High" },
  { label: "Medium" },
  { label: "Low" },
];

const STATUSES = [
  { label: "To Do" },
  { label: "In Progress" },
  { label: "Done" },
];

const defaultTask = {
  title: "",
  description: "",
  dueDate: "",
  assignee: "",
  priority: "Medium",
  status: "To Do",
};

function App() {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("projects");
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    const saved = localStorage.getItem("selectedProjectId");
    return saved ? saved : projects[0]?.id || null;
  });
  useEffect(() => {
    localStorage.setItem("selectedProjectId", selectedProjectId || "");
  }, [selectedProjectId]);

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const [isSidebarHovering, setIsSidebarHovering] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [sortBy, setSortBy] = useState("priority");

  const [showFilters, setShowFilters] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);

  const [form, setForm] = useState(defaultTask);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const handleEdit = (task) => {
    setForm(task);
    setEditId(task.id);
    setShowAddTaskForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Task title is required!");
      return;
    }
    setLoading(true);

    const taskData = { ...form, projectId: selectedProjectId };

    if (editId) {
      setTasks(
        tasks.map((t) =>
          t.id === editId ? { ...t, ...taskData, updatedAt: Date.now() } : t
        )
      );
      toast.success("Task updated successfully!");
    } else {
      setTasks([
        ...tasks,
        { ...taskData, id: Date.now().toString(), createdAt: Date.now() },
      ]);
      toast.success("Task added successfully!");
    }
    setForm(defaultTask);
    setEditId(null);
    setLoading(false);
    setShowAddTaskForm(false);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const tasksForProject = selectedProjectId
    ? tasks.filter((task) => task.projectId === selectedProjectId)
    : [];

  const filteredTasks = tasksForProject
    .filter(
      (t) =>
        (!filterPriority || t.priority === filterPriority) &&
        (!filterStatus || t.status === filterStatus) &&
        (!filterAssignee ||
          (t.assignee && t.assignee.toLowerCase().includes(filterAssignee.toLowerCase()))) &&
        (!filterDate || t.dueDate === filterDate) &&
        (t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(search.toLowerCase())))
    )
    .sort((a, b) => {
      if (sortBy === "priority") {
        return (
          PRIORITIES.findIndex((p) => p.label === a.priority) -
          PRIORITIES.findIndex((p) => p.label === b.priority)
        );
      }
      if (sortBy === "dueDate") {
        return (a.dueDate || "").localeCompare(b.dueDate || "");
      }
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

  const isSidebarVisible = isSidebarHovering || isSidebarPinned;

  return (
    <div className={`app-root ${isSidebarPinned ? "sidebar-pinned" : ""}`}>
      <div
        className="sidebar-hover-area"
        onMouseEnter={() => setIsSidebarHovering(true)}
      />
      <ProjectList
        projects={projects}
        setProjects={setProjects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        setTasks={setTasks}
        tasks={tasks}
        isSidebarVisible={isSidebarVisible}
        isSidebarPinned={isSidebarPinned}
        setIsSidebarPinned={setIsSidebarPinned}
        onSidebarMouseLeave={() => setIsSidebarHovering(false)}
      />
      <div className="main-content">
        <header className="header">
          <div className="search-container main-search">
            <input
              className="filter-input"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="header-actions">
            <button
              className="action-btn"
              onClick={() => setShowFilters(s => !s)}
              title="Show Filters"
            >
              Filter
            </button>
            <button
              className="action-btn add-task-btn"
              onClick={() => {
                setEditId(null);
                setForm(defaultTask);
                setShowAddTaskForm(s => !s);
              }}
              title="Add Task"
            >
              +
            </button>
            <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </div>
        </header>

        {showAddTaskForm && !editId && (
          <form className="add-task-form" onSubmit={handleSubmit}>
            <input
              name="title"
              placeholder="Task Title *"
              value={form.title}
              onChange={handleChange}
              required
              autoFocus
              className={!form.title.trim() && form.title !== "" ? "error" : ""}
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
              min={new Date().toISOString().split('T')[0]}
            />
            <input
              name="assignee"
              placeholder="Assignee"
              value={form.assignee}
              onChange={handleChange}
            />
            <button type="submit" className="add-btn" disabled={loading}>
              {loading ? "Saving..." : (editId ? "Update Task" : "Add Task")}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setShowAddTaskForm(false);
                setEditId(null);
                setForm(defaultTask);
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </form>
        )}

        {showFilters && (
          <section className="filter-row">
            <select
              className="filter-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p.label}>{p.label}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
            <input
              className="filter-input"
              placeholder="Assignee"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            />
            <input
              className="filter-input"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
            </select>
            <button
              className="filter-btn"
              onClick={() => {
                setFilterPriority("");
                setFilterStatus("");
                setFilterAssignee("");
                setFilterDate("");
              }}
            >
              Clear
            </button>
          </section>
        )}

        <main className="dashboard-main">
          <TaskList
            tasks={filteredTasks}
            setTasks={setTasks}
            handleEdit={handleEdit}
            loading={loading}
            projects={projects}
            selectedProjectId={selectedProjectId}
            showAddTaskForm={showAddTaskForm}
            setShowAddTaskForm={setShowAddTaskForm}
            editId={editId}
            setEditId={setEditId}
            form={form}
            setForm={setForm}
            handleSubmit={handleSubmit}
            handleChange={handleChange}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
