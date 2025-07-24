# 🚀 Deploy Event Tracker App on Render

## Step-by-Step Deployment Guide

### 1. Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account (recommended)
3. Authorize Render to access your repositories

### 2. Deploy Database First

#### Create PostgreSQL Database:
1. In Render Dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Fill in the details:
   - **Name**: `event-tracker-db`
   - **Database**: `eventtracker`
   - **User**: `eventuser` (or leave default)
   - **Region**: Choose closest to your users
   - **Plan**: **Free** (500MB, 90 days free, then $7/month)
4. Click **"Create Database"**
5. **IMPORTANT**: Copy the **External Database URL** (starts with `postgres://`)

### 3. Deploy Backend Service

#### Create Web Service for Backend:
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `event-tracker-app`
3. Fill in backend details:
   - **Name**: `event-tracker-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free** (750 hours/month)

#### Set Environment Variables:
Add these environment variables in the **Environment** section:
```
DATABASE_URL=<paste-your-postgres-url-here>
PORT=10000
NODE_ENV=production
```

4. Click **"Create Web Service"**

### 4. Deploy Frontend Service

#### Create Static Site for Frontend:
1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository: `event-tracker-app`
3. Fill in frontend details:
   - **Name**: `event-tracker-frontend`
   - **Root Directory**: `frontend`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

#### Set Environment Variables:
Add this environment variable:
```
REACT_APP_API_URL=https://event-tracker-backend.onrender.com
```
(Replace with your actual backend service URL)

4. Click **"Create Static Site"**

### 5. Database Setup

Once backend is deployed, run database initialization:
1. Go to your backend service dashboard
2. Click **"Shell"** tab
3. Run these commands:
```bash
# Create tables
psql $DATABASE_URL -c "
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming',
    max_attendees INTEGER,
    attendees JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"
```

### 6. Update Frontend with Backend URL

After backend deployment, update the frontend environment variable:
1. Go to your frontend static site dashboard
2. Go to **Environment** section
3. Update `REACT_APP_API_URL` with your actual backend URL
4. Trigger a new deployment

### 7. Test Your Application

Your app will be available at:
- **Frontend**: `https://event-tracker-frontend.onrender.com`
- **Backend API**: `https://event-tracker-backend.onrender.com`

## 🎯 Quick Commands Reference

### Database Connection Test:
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### View Tables:
```bash
psql $DATABASE_URL -c "\dt"
```

### Insert Sample Event:
```bash
psql $DATABASE_URL -c "
INSERT INTO events (title, description, date, time, location, max_attendees)
VALUES ('Sample Event', 'This is a test event', '2025-08-01', '14:00', 'Conference Room A', 50);
"
```

## 💡 Tips for Free Tier

1. **Database**: Free PostgreSQL has 500MB storage and is free for 90 days
2. **Backend**: Free web service sleeps after 15 minutes of inactivity
3. **Frontend**: Static sites are completely free with 100GB bandwidth
4. **Custom Domain**: Available on free tier for static sites
5. **SSL**: Automatic HTTPS for all services

## 🔧 Troubleshooting

### If Backend Won't Start:
- Check logs in Render dashboard
- Verify `package.json` has correct `start` script
- Ensure `DATABASE_URL` environment variable is set

### If Database Connection Fails:
- Verify External Database URL is correct
- Check if database service is running
- Ensure backend and database are in same region

### If Frontend Can't Connect to Backend:
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings in backend
- Ensure backend service is running

## 🚀 Ready to Deploy!

Follow the steps above, and your Event Tracker App will be live on Render!
