# 🗄️ DATABASE SETUP FOR RENDER

## Problem Identified
Your backend can't connect to PostgreSQL because:
- ❌ No DATABASE_URL environment variable on Render
- ❌ No PostgreSQL database provisioned

## Fix Required: Set Up Render PostgreSQL

### Step 1: Create PostgreSQL Database on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "PostgreSQL"
3. Name: `event-tracker-db`
4. Region: `Oregon (US West)`
5. Plan: `Free` (or whatever you prefer)
6. Click "Create Database"

### Step 2: Get Database URL
1. Once created, click on your PostgreSQL service
2. Copy the "External Database URL" (starts with `postgresql://`)
3. It looks like: `postgresql://username:password@host:port/database`

### Step 3: Add Environment Variable to Backend Service
1. Go to your backend service: `event-tracker-backend`
2. Click "Environment" tab
3. Add new environment variable:
   - Key: `DATABASE_URL`
   - Value: (paste the External Database URL from step 2)
4. Click "Save Changes"

### Step 4: Redeploy
1. The backend will automatically redeploy with the new database connection
2. Check logs for the new console messages we added
3. Should see: "✅ Database connection successful"
4. Should see: "✅ Default admin user created successfully"

## Testing After Fix
```bash
# Test health
curl "https://event-tracker-backend.onrender.com/api/health"

# Test users debug  
curl "https://event-tracker-backend.onrender.com/api/debug/users"

# Test login
curl -X POST "https://event-tracker-backend.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"CatchBall2025!Secure#Admin"}'
```

## Credentials
- **Username**: `admin`
- **Password**: `CatchBall2025!Secure#Admin`

The login should work once the database is properly connected! 🚀
