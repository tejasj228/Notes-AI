# Notes AI

<div align="center">

![Notes AI Logo](https://img.shields.io/badge/Notes-AI-8b5cf6?style=for-the-badge&logo=brain&logoColor=white)

**The Next-Generation Note-Taking Experience with AI Integration**

[![React](https://img.shields.io/badge/React-18.x-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

[🚀 Live Demo](https://ainotesai.vercel.app/) • [📖 Documentation](https://your-docs-link.com) 

</div>

---

## 🌟 Overview

Notes AI revolutionizes the way you create, organize, and interact with your notes. Built with modern web technologies and powered by Google's Gemini AI, it offers an intuitive, feature-rich experience that adapts to your workflow.


---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎨 **Beautiful Interface**
- Modern, responsive design
- Dark theme optimized for long sessions
- Smooth animations and transitions
- Glassmorphism UI elements
- Drag & drop interactions

### 🧠 **AI-Powered Assistance**
- Integrated Google Gemini AI
- Context-aware note analysis
- Intelligent suggestions
- Natural language processing
- Real-time chat interface

</td>
<td width="50%">

### 📁 **Smart Organization**
- Color-coded folders (up to 10)
- Flexible note sizing (Small, Medium, Large)
- Keyword tagging system (3 per note)
- Intuitive drag & drop reordering
- Advanced search with filters

### 🔒 **Secure & Reliable**
- JWT-based authentication
- End-to-end data encryption
- Secure cloud storage
- Real-time synchronization
- Offline capability (coming soon)

</td>
</tr>
</table>

---

## 🚀 Quick Start

<details>
<summary><strong>🖥️ Prerequisites</strong></summary>

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [PostgreSQL](https://postgresql.org/) (v13.0.0 or higher)
- [Git](https://git-scm.com/)
- A [Google AI API key](https://makersuite.google.com/app/apikey) for Gemini integration

</details>

### 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/notes-ai.git
cd notes-ai

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### ⚙️ Configuration

<details>
<summary><strong>🔧 Environment Setup</strong></summary>

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notes_ai_app
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGIN=http://localhost:3000
```

</details>

### 🗄️ Database Setup

```bash
# Navigate to backend directory
cd backend

# Create database
createdb notes_ai_app

# Run database setup script
npm run db:setup
```

### 🏃‍♂️ Running the Application

```bash
# Terminal 1: Start the backend server
cd backend
npm run dev

# Terminal 2: Start the frontend application
cd ..
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 🏗️ Project Structure

<details>
<summary><strong>📂 Explore the codebase</strong></summary>

```
notes-ai/
├── 📁 public/                     # Static assets
├── 📁 src/
│   ├── 📁 components/             # React components
│   │   ├── AIChatPage.jsx         # AI chat interface
│   │   ├── NotesGrid.jsx          # Notes masonry grid
│   │   ├── Sidebar.jsx            # Navigation sidebar
│   │   ├── TopNavigation.jsx      # Search and actions bar
│   │   ├── NoteModals.jsx         # Note creation/editing
│   │   ├── FolderModals.jsx       # Folder management
│   │   └── UI.jsx                 # Reusable UI components
│   ├── 📁 hooks/
│   │   ├── useNotesData.js        # Data management hook
│   │   ├── useDragAndDrop.js      # Drag & drop logic
│   │   └── useAPI.js              # API integration
│   ├── 📁 utils/
│   │   ├── constants.js           # App constants
│   │   └── helpers.js             # Utility functions
│   ├── NotesApp.jsx               # Main app component
│   └── index.js                   # App entry point
├── 📁 backend/
│   ├── 📁 config/                 # Configuration files
│   ├── 📁 middleware/             # Express middleware
│   ├── 📁 models/                 # Database models
│   ├── 📁 routes/                 # API routes
│   ├── 📁 scripts/                # Database scripts
│   └── server.js                  # Express server
└── 📄 README.md
```

</details>

---


### 🗂️ Organizing with Folders

1. **Create folders** by clicking the `+` icon in the sidebar
2. **Drag notes** into folders for organization
3. **Customize colors** to match your workflow
4. **Maximum 10 folders** for optimal organization

### 🤖 AI Assistant Features

- **Context Analysis**: AI understands your note content
- **Smart Suggestions**: Get writing recommendations
- **Question Answering**: Ask questions about your notes
- **Content Enhancement**: Improve clarity and structure

---

## 🛠️ API Documentation

<details>
<summary><strong>📋 API Endpoints Overview</strong></summary>

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Notes Management
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Move note to trash
- `PUT /api/notes/reorder` - Reorder notes

### Folders Management
- `GET /api/folders` - Get all folders
- `POST /api/folders` - Create new folder
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

### Trash Management
- `GET /api/trash` - Get trashed notes
- `PUT /api/trash/:id/restore` - Restore note
- `DELETE /api/trash/:id` - Permanently delete

### Search
- `GET /api/search` - Search notes and folders
- `GET /api/search/suggestions` - Get search suggestions

</details>

---

## 🎨 UI Components

<div align="center">

### 🎯 Design System

| Component | Purpose | Features |
|-----------|---------|----------|
| 🏠 **Dashboard** | Main interface | Masonry grid, responsive layout |
| 📝 **Note Editor** | Content creation | Rich text, auto-save, keywords |
| 🗂️ **Folder Sidebar** | Organization | Drag & drop, color coding |
| 🔍 **Search Bar** | Content discovery | Real-time search, filters |
| 🤖 **AI Chat** | Intelligent assistance | Context-aware responses |
| 🗑️ **Trash System** | Data recovery | 30-day retention, bulk operations |

</div>

---

## 🚀 Deployment

### 🌐 Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

</details>

---

## 🤝 Contributing

We welcome contributions from the community!

---

## 🏆 Acknowledgments

Special thanks to:

- **Google** for the amazing Gemini AI API
- **Vercel** for seamless frontend hosting
- **The React Team** for the incredible framework

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by [Tejas Jaiswal](https://github.com/tejasj228)**

[⬆ Back to top](#-notes-ai)

</div>

---

<div align="center">

![Footer Wave](https://capsule-render.vercel.app/api?type=waving&color=8b5cf6&height=100&section=footer&text=Thanks%20for%20visiting!&fontSize=16&fontColor=ffffff&animation=twinkling)

</div>