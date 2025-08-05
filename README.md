# 🏐 Catchball Event Tracker App

A full-stack event management application designed for organizing Catchball (volleyball) events in Seattle. Built with React frontend, Node.js/Express backend, PostgreSQL database, and comprehensive admin controls.

## 🚀 Live Demo

**Production URL:** [https://event-tracker-frontend-qv6e.onrender.com/](https://event-tracker-frontend-qv6e.onrender.com/)

### Demo Credentials
- **Username:** `admin`
- **Password:** `CatchBall2025!Secure#Admin`
- **Role:** Administrator (Full access to all features)

### Access Levels
- 🌐 **Guest Users**: View events, join/leave events, browse event details
- 👑 **Administrators**: Create events, edit events, delete events, manage attendees, full system access

## 📁 Project Structure

```
event-tracker-app/
├── backend/              # Node.js Express API server
│   ├── index.js         # Main server file with REST API endpoints
│   └── database.js      # PostgreSQL database configuration and queries
├── frontend/            # React single-page application
│   ├── public/          # Static assets and configuration files
│   ├── src/             # React source code
│   │   ├── components/  # Reusable React components
│   │   ├── contexts/    # React context providers (UserContext)
│   │   ├── services/    # API service functions and HTTP client
│   │   ├── App.js       # Main application component with routing
│   │   ├── index.js     # React application entry point
│   │   └── index.css    # Global styles and CSS variables
│   └── package.json     # Frontend dependencies and scripts
├── db/                  # Legacy JSON database (deprecated)
│   └── events.json      # Legacy event data storage
├── bot/                 # Bot functionality (future enhancement)
│   └── createGroup.js   # Event grouping automation
├── render.yaml          # Render.com deployment configuration
├── railway.json         # Railway deployment configuration
└── package.json         # Root dependencies and build scripts
```

## ✨ Core Features

### 🎯 Event Management System
- **Event Creation**: Administrators can create detailed events with date, time, location, and attendee capacity
- **Real-time Status Tracking**: Events display live status indicators (Scheduled, Live Now, Finished)
- **Smart Event Sorting**: Automatic chronological sorting with closest events displayed first
- **Capacity Management**: Configurable attendee limits with visual "FULL" indicators
- **Event Lifecycle**: Complete CRUD operations with validation and error handling

### 👥 Attendee Management
- **Quick Registration**: Streamlined join/leave functionality for event participants
- **Team Assignment**: Predefined team selection (Good Vibes, Sunflowers, Thunders, Dream Catchers, etc.)
- **Contact Collection**: Name and phone number capture for event coordination
- **Administrative Controls**: Admin-level attendee removal and management capabilities
- **Real-time Updates**: Live attendee count updates and capacity tracking

### 🔐 Security & Authentication
- **Role-based Access Control**: Secure admin authentication with bcrypt password hashing
- **Guest Access**: Public event viewing and participation without mandatory registration
- **Protected Operations**: Admin-only access to event creation, editing, and deletion
- **Session Management**: Persistent login state with secure user context
- **Input Security**: Autocomplete disabled on all forms to prevent data leakage

### 📱 User Experience
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox layouts
- **Real-time Interface**: Live status badges and automatic content refreshing
- **Single-page Application**: Smooth navigation without page reloads
- **Intuitive Design**: Clean, modern interface with consistent visual hierarchy
- **Error Handling**: Comprehensive user feedback and graceful error recovery

## 🛠️ Technology Stack

### Frontend Technologies
- **React 18.2.0**: Modern functional components with hooks and context API
- **React Router DOM 7.7.1**: Client-side routing and single-page application navigation
- **Axios 1.4.0**: HTTP client for API communication and request handling
- **CSS Grid & Flexbox**: Responsive layout system with mobile-first design
- **React Scripts 5.0.1**: Build tooling, development server, and optimization

### Backend Technologies
- **Node.js**: JavaScript runtime environment for server-side execution
- **Express.js**: Minimal web application framework for REST API development
- **PostgreSQL**: Relational database with ACID compliance and structured schemas
- **bcrypt 6.0.0**: Password hashing library with salt rounds for security
- **CORS 2.8.5**: Cross-origin resource sharing middleware
- **pg (node-postgres)**: PostgreSQL client library for Node.js

### Database Architecture
- **Users Table**: Administrator authentication with encrypted password storage
- **Events Table**: Event details, metadata, timestamps, and status tracking
- **Attendees Table**: Participant information with foreign key relationships
- **Relational Design**: Normalized structure with CASCADE operations and referential integrity

### Development & Deployment
- **nodemon**: Development server with hot-reload functionality
- **concurrently**: Tool for running multiple development processes simultaneously
- **dotenv**: Environment variable management for configuration
- **Render.com**: Cloud hosting platform for both frontend and backend services
- **GitHub**: Version control and collaborative development

### Running the Application

#### Option 1: Run both frontend and backend together
```bash
npm run dev:full
```

#### Option 2: Run separately

**Start the backend server:**
```bash
npm run server
# or
npm start
```
Server will run on http://localhost:8000

**Start the frontend (in a new terminal):**
```bash
npm run client
```
Frontend will run on http://localhost:3000

### Running the Bot

To test the event grouping bot:

```bash
node bot/createGroup.js
```

This will create sample groups and display them in the console.

## API Endpoints

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Health Check
- `GET /api/health` - Server health status

## Event Data Structure

```json
{
  "id": "unique-id",
  "title": "Event Title",
  "description": "Event description",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "location": "Event location",
  "attendees": ["Attendee 1", "Attendee 2"],
  "status": "planned|scheduled|completed|cancelled",
  "createdAt": "ISO datetime",
  "updatedAt": "ISO datetime"
}
```

## Development Scripts

```bash
# Install all dependencies
npm run install-all

# Start backend only
npm start
npm run server

# Start frontend only
npm run client

# Start both (recommended for development)
npm run dev:full

# Run bot
node bot/createGroup.js
```

## Bot Usage

The bot can create event groups based on various criteria:

```javascript
const EventGroupBot = require('./bot/createGroup');
const bot = new EventGroupBot();

// Create group by status
await bot.createGroup('Scheduled Events', { status: 'scheduled' });

// Create group by date range
await bot.createGroup('This Week', {
  startDate: '2025-07-24',
  endDate: '2025-07-31'
});

// Create group by keyword
await bot.createGroup('Meetings', { keyword: 'meeting' });

// Create group by attendee count
await bot.createGroup('Large Events', { minAttendees: 5 });
```

## Technologies Used

### Backend
- Node.js
- Express.js
- fs-extra (file operations)
- cors (Cross-Origin Resource Sharing)
- body-parser

### Frontend
- React 18
- React Router DOM
- Axios (HTTP client)
- CSS Grid & Flexbox

### Development Tools
- nodemon (development server)
- concurrently (run multiple scripts)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for learning or as a base for your own applications.

## Future Enhancements

- [x] ~~Add user authentication~~ ✅ **Implemented**
- [x] ~~Role-based access control~~ ✅ **Implemented**
- [x] ~~Guest access for viewing and joining events~~ ✅ **Implemented**
- [ ] Implement real database (MongoDB/PostgreSQL)
- [ ] Add email notifications
- [ ] Calendar integration
- [ ] Event templates
- [ ] Advanced search and filtering
- [ ] File uploads for events
- [ ] Export events to calendar formats
- [ ] Real-time updates with WebSockets
- [ ] Mobile responsive improvements
- [ ] Event capacity limits
- [ ] RSVP system with confirmations
- [ ] Event reminders
