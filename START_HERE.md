# 🚀 Quick Start Guide

## How to Start Your Event Tracker App

### Step 1: Open Two Terminal Windows

#### Terminal 1 - Start Backend Server
```bash
cd /Users/liliakryvelova/LiliiaProjects/Catchball_form/event-tracker-app/backend
node index.js
```
**Expected Output:**
```
Server running on http://localhost:8000
```

#### Terminal 2 - Start Frontend Server  
```bash
cd /Users/liliakryvelova/LiliiaProjects/Catchball_form/event-tracker-app/frontend
npm start
```
**Expected Output:**
```
webpack compiled successfully
Local:            http://localhost:3000
```

### Step 2: Access the Application
Open your browser and go to: **http://localhost:3000**

---

## 🔧 Alternative: Using VS Code Terminal

1. **Open VS Code Terminal** (View → Terminal)
2. **Split Terminal** (Click the split icon)
3. **Run backend in first terminal:**
   ```bash
   cd backend && node index.js
   ```
4. **Run frontend in second terminal:**
   ```bash
   cd frontend && npm start
   ```

---

## 🎯 Testing Your App

### Test as Guest User:
1. Go to http://localhost:3000
2. Click on any event
3. Click "Join Event" 
4. Fill out the form:
   - **Name:** Your full name
   - **Team:** Select from dropdown (Alpha, Beta, etc.)
   - **Phone:** Your phone number
5. Submit to join

### Test as Admin:
1. Click "Admin Login"
2. Enter credentials:
   - **Phone:** `+1234567890`
   - **Team:** `Alpha`
3. Now you can create, edit, and delete events

---

## 🐛 Troubleshooting

### Port Already in Use:
- Kill existing processes: `pkill -f "node index.js"`
- Or use different ports in the code

### Frontend Won't Start:
- Make sure dependencies are installed: `cd frontend && npm install`

### Backend Database Issues:
- Check if `db/events.json` exists
- Make sure backend has write permissions

---

## 📱 Features to Test

✅ **Guest Access** - View and join events without login  
✅ **Admin Login** - Full CRUD permissions  
✅ **Join Form** - Name, team dropdown, phone validation  
✅ **Duplicate Prevention** - Phone number checking  
✅ **Responsive Design** - Works on mobile and desktop  
✅ **Role Badges** - Admin users get crown icons  

---

## 🎉 Your App is Ready!

Once both servers are running, your event tracker app will be fully functional with all the features you requested:

- **Guest users** can view and join events
- **Admin users** can manage everything  
- **Beautiful UI** with enhanced forms and cards
- **Phone validation** prevents duplicate registrations
- **Team selection** from predefined dropdown options

Enjoy your new event tracker app! 🎊
