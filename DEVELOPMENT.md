# 🎯 Event Tracker App - Development Guide

## Quick Start

### Option 1: Using the Start Script (Recommended)
```bash
cd event-tracker-app
./start.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
node index.js

# Terminal 2 - Frontend  
cd frontend
npm start
```

## 🔧 Application Overview

### Features Implemented
- ✅ **Guest Access**: Non-logged users can view events and join them
- ✅ **Admin System**: Admin login with full CRUD permissions
- ✅ **Detailed Registration**: Name, team selection, and phone number
- ✅ **Duplicate Prevention**: Phone number-based validation
- ✅ **Role-Based Access**: Edit/Delete only for admins
- ✅ **Enhanced UI**: Beautiful forms and attendee cards

### Architecture
- **Backend**: Node.js/Express server on port 8000
- **Frontend**: React 18 on port 3000
- **Database**: JSON file storage (`db/events.json`)
- **Authentication**: Context-based with admin credentials

### Access Levels
1. **Guest Users** (No Login Required)
   - View all events
   - Join events with detailed form
   - Cannot edit or delete

2. **Admin Users** (Login Required)
   - All guest permissions
   - Create new events
   - Edit existing events
   - Delete events and attendees

## 🔐 Admin Credentials
- **Phone**: `+1234567890`
- **Team**: `Alpha`
- **Role**: `admin`

## 📝 Join Event Form Fields
- **Your Name**: Full name (required)
- **Team**: Dropdown selection from 10 predefined teams (required)
- **Phone Number**: Contact number for duplicate prevention (required)

### Available Teams
- Alpha, Beta, Gamma, Delta, Epsilon
- Zeta, Eta, Theta, Iota, Kappa

## 🎨 UI Enhancements
- **Responsive Form Layout**: Side-by-side fields on desktop
- **Enhanced Attendee Cards**: Hover effects and role badges
- **Admin Badges**: Crown icons for admin attendees
- **Professional Styling**: Gradients and shadows

## 🔍 Testing Scenarios

### 1. Guest User Flow
1. Open http://localhost:3000
2. Click on any event
3. Click "Join Event"
4. Fill out the form with name, team, and phone
5. Submit to join the event

### 2. Admin User Flow
1. Click "Admin Login"
2. Use admin credentials (+1234567890, Alpha)
3. Create, edit, or delete events
4. Manage attendees

### 3. Duplicate Prevention Test
1. Join an event as a guest
2. Try to join the same event with the same phone number
3. Should see duplicate prevention message

## 📊 Data Structure

### Event Object
```json
{
  "id": "unique_id",
  "title": "Event Title",
  "description": "Event Description",
  "date": "ISO_DATE_STRING",
  "location": "Event Location",
  "attendees": [
    {
      "name": "Full Name",
      "team": "TeamName", 
      "phone": "+1234567890",
      "role": "guest|admin"
    }
  ],
  "createdAt": "ISO_DATE_STRING",
  "updatedAt": "ISO_DATE_STRING"
}
```

## 🛠 Development Notes

### File Structure
```
event-tracker-app/
├── backend/
│   └── index.js           # Express server
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # UserContext for auth
│   │   └── index.css      # Enhanced styling
├── db/
│   └── events.json        # Data storage
└── start.sh              # Development startup script
```

### Key Components
- **App.js**: Main app with routing and authentication
- **EventDetail.js**: Enhanced event view with join form
- **UserContext.js**: Authentication and user management
- **Login.js**: Admin login form

### CSS Enhancements
- `.join-form`: Enhanced form styling with gradients
- `.attendee-card`: Hover effects and professional appearance
- `.admin-badge`: Crown icon badges for admins
- `.form-row`: Responsive grid layout

## 🚀 Next Steps for Enhancement
1. Add search and filtering for events
2. Implement email notifications
3. Add event categories
4. Implement user profiles
5. Add calendar integration
6. Create mobile app version

## 🐛 Troubleshooting
- **Port conflicts**: Backend uses 8000, frontend uses 3000
- **CORS issues**: Already configured in backend
- **Data persistence**: Check `db/events.json` for data
- **Admin access**: Use exact phone number `+1234567890`

## 📱 Mobile Responsiveness
- Form fields stack vertically on mobile
- Attendee cards adapt to screen size
- Touch-friendly button sizes
- Optimized for iOS/Android browsers
