# Notes-AI Backend

A comprehensive Node.js + Express + MongoDB backend API for the Notes-AI application.

## 🚀 Features

- **Authentication**: JWT-based auth with email/password and Google OAuth support
- **Notes Management**: Full CRUD operations with folder organization
- **AI Integration**: Google Gemini AI for note analysis and chat
- **File Upload**: Cloudinary integration for image storage
- **Search**: Advanced search across notes and folders
- **Trash System**: Soft delete with restore functionality
- **Real-time**: WebSocket support for live updates (future feature)

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── upload.js            # File upload handling
│   └── errorHandler.js      # Global error handler
├── models/
│   ├── User.js              # User schema
│   ├── Note.js              # Note schema
│   ├── Folder.js            # Folder schema
│   └── ChatMessage.js       # AI chat messages
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── notes.js             # Notes CRUD routes
│   ├── folders.js           # Folders CRUD routes
│   ├── trash.js             # Trash management
│   ├── upload.js            # File upload routes
│   ├── ai.js                # AI chat routes
│   └── search.js            # Search routes
├── utils/
│   └── helpers.js           # Utility functions
├── .env.example             # Environment variables template
├── server.js                # Main server file
└── package.json
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Environment Variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/notes-ai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

Make sure MongoDB is running locally or provide a cloud MongoDB URI.

### 4. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User

```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Google OAuth

```http
POST /api/auth/google
Content-Type: application/json

{
  "email": "john@gmail.com",
  "name": "John Doe",
  "googleId": "google-user-id"
}
```

### Notes Endpoints

#### Get All Notes

```http
GET /api/notes?folder=null&search=query&limit=20&skip=0
Authorization: Bearer <token>
```

#### Create Note

```http
POST /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Note",
  "content": "Note content here",
  "keywords": ["tag1", "tag2"],
  "color": "purple",
  "size": "medium",
  "folderId": null
}
```

#### Update Note

```http
PUT /api/notes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Note",
  "content": "Updated content"
}
```

#### Delete Note (Move to Trash)

```http
DELETE /api/notes/:id
Authorization: Bearer <token>
```

### Folders Endpoints

#### Get All Folders

```http
GET /api/folders?includeNotesCount=true
Authorization: Bearer <token>
```

#### Create Folder

```http
POST /api/folders
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Folder",
  "color": "blue"
}
```

### AI Chat Endpoints

#### Send Message to AI

```http
POST /api/ai/chat/:noteId
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Explain this note to me"
}
```

#### Get Chat History

```http
GET /api/ai/chat/:noteId/history
Authorization: Bearer <token>
```

### File Upload Endpoints

#### Upload Image

```http
POST /api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
```

#### Upload Base64 Image

```http
POST /api/upload/base64
Authorization: Bearer <token>
Content-Type: application/json

{
  "base64Data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "filename": "screenshot.png"
}
```

### Search Endpoints

#### Basic Search

```http
GET /api/search?q=search-term&type=all&limit=20
Authorization: Bearer <token>
```

#### Advanced Search

```http
POST /api/search/advanced
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "meeting",
  "colors": ["purple", "blue"],
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "sortBy": "updatedAt",
  "sortOrder": "desc"
}
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Configurable CORS settings
- **Input Validation**: Mongoose schema validation
- **XSS Protection**: HTML sanitization
- **Helmet**: Security headers

## 🚀 Performance Features

- **Database Indexing**: Optimized MongoDB indexes
- **Pagination**: Efficient data loading
- **Aggregation Pipelines**: Complex queries optimization
- **File Compression**: Image optimization via Cloudinary
- **Caching**: Redis support (future feature)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🐳 Docker Support

```dockerfile
# Dockerfile (future feature)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Monitoring & Logging

- **Morgan**: HTTP request logging
- **Error Tracking**: Comprehensive error handling
- **Health Checks**: `/health` endpoint
- **Performance Metrics**: Response time tracking

## 🔧 Development

### Code Style

- ESLint configuration
- Prettier formatting
- Consistent naming conventions

### Git Hooks

- Pre-commit linting
- Automated testing

## 📝 API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": { ... },
    "notes": [ ... ]
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Optional validation errors
}
```

## 🔄 Integration with Frontend

The backend is designed to work seamlessly with the existing React frontend. Key integration points:

1. **Authentication**: JWT tokens for session management
2. **Data Format**: Matches frontend data structures
3. **Real-time Updates**: WebSocket support (future)
4. **File Handling**: Direct integration with frontend drag-drop
5. **Search**: Real-time search with debouncing

## 🚀 Deployment

### Environment Setup

```bash
# Production environment
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
```

### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "notes-ai-backend"

# Monitor
pm2 monitor
```

## 📈 Scaling Considerations

- **Database Sharding**: For large datasets
- **Load Balancing**: Multiple server instances
- **CDN Integration**: Static file delivery
- **Caching Layer**: Redis for frequently accessed data
- **Microservices**: Split AI features into separate service

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.
