import React, { useState } from "react";

const PASTEL_COLORS = [
    { light: "#FFB3BA", dark: "#FF8A95" }, { light: "#BAFFC9", dark: "#8AFFA3" },
    { light: "#BAE1FF", dark: "#8AC8FF" }, { light: "#FFFFBA", dark: "#FFFF8A" },
    { light: "#FFB3F7", dark: "#FF8AEF" }, { light: "#B3FFE6", dark: "#8AFFD4" },
    { light: "#FFD4B3", dark: "#FFB88A" }, { light: "#E6B3FF", dark: "#D48AFF" },
    { light: "#B3D9FF", dark: "#8AC8FF" }, { light: "#B3FFB3", dark: "#8AFF8A" },
    { light: "#FFE6B3", dark: "#FFD48A" }, { light: "#D4B3FF", dark: "#C18AFF" },
    { light: "#B3FFF0", dark: "#8AFFE6" }, { light: "#FFB3D9", dark: "#FF8AC8" },
    { light: "#B3E6FF", dark: "#8AD4FF" }, { light: "#D9FFB3", dark: "#C8FF8A" },
    { light: "#FFB3A3", dark: "#FF8A8A" }, { light: "#B3B3FF", dark: "#8A8AFF" },
    { light: "#B3FFCC", dark: "#8AFFB3" }, { light: "#FFCCB3", dark: "#FFB38A" },
];

function ProjectList({
    projects,
    setProjects,
    selectedProjectId,
    setSelectedProjectId,
    setTasks,
    tasks,
    isSidebarVisible,
    isSidebarPinned,
    setIsSidebarPinned,
    onSidebarMouseLeave,
}) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", color: PASTEL_COLORS[0].light });
    const [editId, setEditId] = useState(null);
    const [projectSearch, setProjectSearch] = useState("");
    const [showProjectSearch, setShowProjectSearch] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        if (editId) {
            setProjects(
                projects.map((p) => (p.id === editId ? { ...p, ...form } : p))
            );
            setEditId(null);
            setSelectedProjectId(editId);
        } else {
            const newId = Date.now().toString();
            setProjects([...projects, { ...form, id: newId }]);
            setSelectedProjectId(newId);
        }
        setForm({ name: "", description: "", color: PASTEL_COLORS[0].light });
        setShowForm(false);
    };

    const handleEdit = (project) => {
        setForm(project);
        setEditId(project.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        setProjects(projects.filter((p) => p.id !== id));
        setTasks(tasks.filter((t) => t.projectId !== id));
        if (selectedProjectId === id) {
            const next = projects.find((p) => p.id !== id);
            setSelectedProjectId(next?.id || null);
        }
    };

    const isDarkMode = document.body.classList.contains('dark');

    const filteredProjects = projects.filter((p) =>
        p.name.toLowerCase().includes(projectSearch.toLowerCase())
    );

    const isCollapsed = !isSidebarPinned;

    return (
        <aside
            className={`project-sidebar ${isSidebarVisible ? "visible" : ""} ${isSidebarPinned ? "pinned" : "collapsed"}`}
            onMouseLeave={!isSidebarPinned ? onSidebarMouseLeave : undefined}
        >
            <div className="sidebar-content">
                <div className="sidebar-header">
                    {!isCollapsed && (
                        <div className="project-search-container">
                            {showProjectSearch ? (
                                <input
                                    className="project-search-input"
                                    placeholder="Search projects..."
                                    value={projectSearch}
                                    onChange={(e) => setProjectSearch(e.target.value)}
                                    onBlur={() => setShowProjectSearch(false)}
                                    autoFocus
                                />
                            ) : (
                                <button
                                    className="sidebar-action-btn"
                                    onClick={() => setShowProjectSearch(true)}
                                    aria-label="Search projects"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <h2 style={{ display: isCollapsed ? "none" : undefined }}>Projects</h2>
                <ul>
                    {filteredProjects.map((project) => (
                        <li
                            key={project.id}
                            className={selectedProjectId === project.id ? "active" : ""}
                            style={{
                                '--project-color': project.color,
                                borderLeft: isCollapsed ? "none" : `4px solid var(--project-color)`,
                            }}
                        >
                            <span
                                className={`project-dot ${isCollapsed ? "clickable" : ""}`}
                                style={{ background: project.color }}
                                title={project.name}
                                onClick={() => setSelectedProjectId(project.id)}
                            />
                            {!isCollapsed && (
                                <>
                                    <button
                                        className="project-select-btn"
                                        onClick={() => setSelectedProjectId(project.id)}
                                        aria-label={`Select project ${project.name}`}
                                    >
                                        {project.name}
                                    </button>
                                    <button
                                        className="sidebar-edit-btn"
                                        onClick={() => handleEdit(project)}
                                        aria-label="Edit project"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="sidebar-delete-btn"
                                        onClick={() => handleDelete(project.id)}
                                        aria-label="Delete project"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
                {!isCollapsed && (
                    <button
                        className="add-project-btn"
                        onClick={() => {
                            setShowForm(true);
                            setEditId(null);
                        }}
                    >
                        + Add Project
                    </button>
                )}
                {showForm && !isCollapsed && (
                    <form className="project-form" onSubmit={handleSubmit}>
                        <input
                            name="name"
                            placeholder="Project Name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                        <input
                            name="description"
                            placeholder="Description"
                            value={form.description}
                            onChange={handleChange}
                        />
                        <div className="color-picker-container">
                            <label>Choose Color:</label>
                            <div className="color-options">
                                {PASTEL_COLORS.map((colorObj, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`color-option ${form.color === colorObj.light ? "selected" : ""}`}
                                        style={{ backgroundColor: isDarkMode ? colorObj.dark : colorObj.light }}
                                        onClick={() => setForm({ ...form, color: colorObj.light })}
                                        title={`Color ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <button type="submit">{editId ? "Update" : "Add"}</button>
                        <button type="button" onClick={() => setShowForm(false)}>
                            Cancel
                        </button>
                    </form>
                )}
            </div>
            <div className="sidebar-footer">
                <button
                    className="sidebar-toggle-btn"
                    onClick={() => setIsSidebarPinned((c) => !c)}
                    aria-label={isSidebarPinned ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {isSidebarPinned ? "<" : ">"}
                </button>
            </div>
        </aside>
    );
}

export default ProjectList;
