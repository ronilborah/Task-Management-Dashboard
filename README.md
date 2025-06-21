# Task Management System

A modern, responsive task management application with project organization, drag-and-drop functionality, and dark mode support.

## Features

- **Project Management**: Create and organize tasks by projects
- **Task Management**: Add, edit, delete, and organize tasks
- **Drag & Drop**: Move tasks between priority/status columns
- **Filtering & Sorting**: Filter by priority, status, assignee, and due date
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Notifications**: Get notified about due tasks
- **Collapsible Sidebar**: Save space with a collapsible project sidebar

## Tech Stack

### Frontend
- React 19
- CSS3 with CSS Variables for theming
- React Toastify for notifications
- @hello-pangea/dnd for drag and drop

### Backend
- Node.js with Express
- MongoDB with Mongoose
- CORS enabled for cross-origin requests

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TaskManagementSystemUpgrade
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd client
   npm install
   
   # Install backend dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `server` directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/taskmanager
   PORT=8000
   ```
   
   Replace the MongoDB URI with your own connection string.

4. **Start the application**
   
   In one terminal (backend):
   ```bash
   cd server
   npm start
   ```
   
   In another terminal (frontend):
   ```bash
   cd client
   npm start
   ```

5. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

## Usage

### Creating Projects
1. Click the "+ Add Project" button in the sidebar
2. Enter project name and description
3. Choose a color for the project
4. Click "Add" to create the project

### Managing Tasks
1. Select a project from the sidebar
2. Use the "Add Task" form to create new tasks
3. Drag tasks between columns to change priority or status
4. Use filters to find specific tasks
5. Click the toggle button to switch between priority and status views

### Features
- **Dark Mode**: Click the "Light/Dark" button in the header
- **Sidebar Toggle**: Click the arrow button to collapse/expand the sidebar
- **Task Actions**: Edit, delete, or mark tasks as complete
- **Search**: Use the search bar to find tasks by title or description

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/project/:projectId` - Get tasks by project
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `DELETE /api/tasks/project/:projectId` - Delete all tasks for a project

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License. 