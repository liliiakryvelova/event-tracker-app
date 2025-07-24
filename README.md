# Event Tracker App

A full-stack event tracking application with React frontend, Node.js backend, PostgreSQL database, and real-time features.

## 🚀 Demo Access

**Live Demo:** [https://event-tracker-frontend-qv6e.onrender.com/](https://event-tracker-frontend-qv6e.onrender.com/)

### Demo Credentials:
- **Username:** `admin`
- **Password:** `CatchBall2025!Secure#Admin`
- **Role:** Admin (Can create/edit/delete events)

### Access Levels:
- 🌐 **Everyone** (including guests): View events, join/leave events
- 👑 **Admin only**: Create events, edit events, delete events, manage attendees

## Project Structure

```
event-tracker-app/
├── backend/           # Node.js Express server
│   └── index.js      # Main server file with REST API
├── frontend/         # React application
│   ├── public/       # Static files
│   ├── src/          # React source code
│   │   ├── components/   # React components
│   │   ├── services/     # API service functions
│   │   ├── App.js       # Main App component
│   │   ├── index.js     # React entry point
│   │   └── index.css    # Global styles
│   └── package.json  # Frontend dependencies
├── db/               # JSON database
│   └── events.json   # Event data storage
├── bot/              # Bot functionality
│   └── createGroup.js # Event grouping bot
└── package.json      # Root dependencies
```

## Features

### Backend (Node.js + Express)
- REST API for event management (CRUD operations)
- JSON file-based database
- CORS enabled for frontend communication
- Error handling and validation
- Health check endpoint

### Frontend (React)
- Modern React with hooks
- React Router for navigation
- Responsive design with CSS Grid
- Event listing, creation, editing, and deletion
- Real-time status updates
- Attendee management
- Clean and intuitive UI
- **User Authentication & Role-based Access Control**
- **Admin-only Edit/Delete permissions**

### Bot Functionality
- Event grouping by criteria (date, status, location, etc.)
- Automated event categorization
- Group management (create, update, delete)
- Filter events by various parameters

### Database
- JSON-based storage (events.json)
- Structured event data with metadata
- Easy to read and modify

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install root dependencies:**
   ```bash
   cd event-tracker-app
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

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
