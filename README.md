# Pause App Backend

Production-ready Node.js/Express backend for the Pause App with MongoDB, JWT authentication, Google OAuth, and Firebase push notifications.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Render Deployment Guide](#render-deployment-guide)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Common Issues and Solutions](#common-issues-and-solutions)

## Features

- RESTful API with Express.js
- MongoDB database with Mongoose ODM
- JWT-based authentication
- Google OAuth 2.0 integration
- Firebase Admin SDK for push notifications
- Request validation with Joi
- CORS configuration
- Request logging with Morgan
- Environment-based configuration
- Graceful shutdown handling
- Health check endpoint
- ESLint code quality checks
- Production-ready error handling

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 18.0.0 or higher)
- npm (version 9.0.0 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Git

You will also need accounts for:

- MongoDB Atlas (for cloud database)
- Firebase Console (for push notifications)
- Google Cloud Console (for OAuth)
- Render.com (for deployment)

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including Express, Mongoose, Firebase Admin SDK, and development tools.

### Step 3: Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/Pause

# JWT Configuration (must be at least 32 characters)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com

# CORS Configuration (comma-separated, no spaces)
ALLOWED_ORIGINS=http://localhost:3000

# Firebase Configuration (for local development)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

### Step 4: MongoDB Setup

#### Option A: Local MongoDB

1. Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```
3. Use connection string: `mongodb://localhost:27017/Pause`

#### Option B: MongoDB Atlas (Recommended)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a new cluster (M0 Free tier is sufficient for development)
3. Click "Connect" and select "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Update `MONGODB_URI` in `.env` file

Example:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/Pause?retryWrites=true&w=majority
```

### Step 5: Google OAuth Setup

1. Go to https://console.cloud.google.com
2. Create a new project or select existing one
3. Enable "Google+ API"
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Create OAuth client ID for "Web application"
7. Copy the "Client ID"
8. Update `GOOGLE_WEB_CLIENT_ID` in `.env` file

### Step 6: Firebase Setup

1. Go to https://console.firebase.google.com
2. Create a new project or select existing one
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the downloaded JSON file as `backend/src/config/serviceAccountKey.json`
6. Make sure this file is in `.gitignore` (already configured)

### Step 7: Validate Configuration

Run the validation script to check if all environment variables are properly set:

```bash
npm run validate
```

Expected output:
```
Environment variables validated successfully
```

### Step 8: Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:5001`

You should see:
```
MongoDB Connected: <your-mongodb-host>
Firebase Admin SDK initialized successfully
Server running on http://0.0.0.0:5001
```

### Step 9: Test the API

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-03-20T10:30:00.000Z",
  "uptime": 5.123,
  "environment": "development"
}
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/Pause` |
| `JWT_SECRET` | Secret key for JWT (min 32 chars) | `your_secret_key_here` |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `GOOGLE_WEB_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |

### Firebase Variables (Choose One Option)

#### Option 1: Service Account File (Development)
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

#### Option 2: Environment Variables (Production)
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\n-----END PRIVATE KEY-----\n"
```

## Running the Application

### Development Mode

Runs with nodemon for auto-restart on file changes:

```bash
npm run dev
```

### Production Mode

Runs without auto-restart:

```bash
npm start
```

### Linting

Check and fix code quality issues:

```bash
# Auto-fix issues
npm run lint

# Check without fixing
npm run lint:check
```

### Validate Environment

Check if all required environment variables are set:

```bash
npm run validate
```

## Render Deployment Guide

### Prerequisites for Deployment

Before deploying to Render, ensure you have:

1. GitHub account with your code pushed
2. MongoDB Atlas cluster (free M0 tier is fine)
3. Firebase project with service account credentials
4. Google OAuth credentials
5. Render.com account (free tier available)

### Step 1: Prepare MongoDB Atlas

1. Log in to https://cloud.mongodb.com
2. Create a new cluster or use existing one
3. Go to "Database Access" and create a database user:
   - Username: `pauseapp` (or your choice)
   - Password: Generate a secure password
   - Database User Privileges: "Read and write to any database"
4. Go to "Network Access" and add IP address:
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - This is required for Render to connect
5. Go to "Database" > "Connect" > "Connect your application"
6. Copy the connection string
7. Replace `<password>` with your database user password
8. Save this connection string for later

Example connection string:
```
mongodb+srv://pauseapp:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/Pause?retryWrites=true&w=majority
```

### Step 2: Prepare Firebase Credentials

1. Go to https://console.firebase.google.com
2. Select your project
3. Go to Project Settings (gear icon) > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Open the JSON file and extract these values:
   - `project_id` - This is your `FIREBASE_PROJECT_ID`
   - `client_email` - This is your `FIREBASE_CLIENT_EMAIL`
   - `private_key` - This is your `FIREBASE_PRIVATE_KEY`

IMPORTANT: Keep the `\n` characters in the private key as literal text (not actual newlines).

Example:
```
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

### Step 3: Generate JWT Secret

Generate a secure random string (at least 32 characters):

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator
# https://www.grc.com/passwords.htm
```

Save this for the `JWT_SECRET` environment variable.

### Step 4: Push Code to GitHub

Ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Backend ready for deployment"
git push origin main
```

### Step 5: Create Render Web Service

#### Method A: Using Blueprint (Automatic)

1. Go to https://dashboard.render.com
2. Click "New +" > "Blueprint"
3. Connect your GitHub account if not already connected
4. Select your repository
5. Render will automatically detect the `render.yaml` file
6. Click "Apply"
7. Skip to Step 6 to add environment variables

#### Method B: Manual Setup

1. Go to https://dashboard.render.com
2. Click "New +" > "Web Service"
3. Connect your GitHub account if not already connected
4. Select your repository
5. Configure the service:

**Basic Settings:**
- Name: `pause-backend` (or your choice)
- Region: Select closest to your users (e.g., Oregon USA, Frankfurt EU)
- Branch: `main` or `develop`
- Root Directory: `backend`
- Runtime: `Node`

**Build & Deploy:**
- Build Command: `npm install`
- Start Command: `npm start`

**Plan:**
- Select "Free" (or paid plan for better performance)

6. Click "Create Web Service" (don't deploy yet, we need to add environment variables first)

### Step 6: Configure Environment Variables

In the Render dashboard, go to your service > Environment tab.

Add the following environment variables:

#### Required Variables

```
NODE_ENV=production
PORT=10000
```

#### MongoDB Configuration

```
MONGODB_URI=mongodb+srv://pauseapp:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/Pause?retryWrites=true&w=majority
```
Replace with your actual MongoDB Atlas connection string.

#### JWT Configuration

```
JWT_SECRET=your_generated_secret_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
```
Use the JWT secret you generated in Step 3.

#### Google OAuth Configuration

```
GOOGLE_WEB_CLIENT_ID=your-client-id.apps.googleusercontent.com
```
Use your Google OAuth client ID.

#### CORS Configuration

```
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
```
Replace with your actual frontend URLs (comma-separated, no spaces).

For testing, you can use:
```
ALLOWED_ORIGINS=*
```

#### Firebase Configuration

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

CRITICAL: For `FIREBASE_PRIVATE_KEY`:
- Copy the entire private key from your Firebase service account JSON
- Keep the `\n` characters as literal text (type backslash-n, not actual newlines)
- Wrap the entire key in double quotes
- Do not add extra spaces or newlines

### Step 7: Deploy

1. After adding all environment variables, click "Save Changes"
2. Render will automatically start deploying
3. Monitor the deployment logs for any errors
4. Wait for the deployment to complete (usually 2-5 minutes)

### Step 8: Verify Deployment

Once deployment is complete, you'll get a URL like:
```
https://pause-backend.onrender.com
```

Test the health endpoint:

```bash
curl https://pause-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-03-20T10:30:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

Test the root endpoint:

```bash
curl https://pause-backend.onrender.com/
```

Expected response:
```json
{
  "message": "Pause App API",
  "version": "1.0.0",
  "status": "running"
}
```

### Step 9: Update Mobile App

Update your mobile app's API base URL to:

```javascript
const API_BASE_URL = 'https://pause-backend.onrender.com/api/v1';
```

### Step 10: Test API Endpoints

Test authentication and other endpoints to ensure everything works:

```bash
# Test Google OAuth endpoint
curl -X POST https://pause-backend.onrender.com/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "your-google-id-token"}'
```

## API Endpoints

### Health Check

```
GET /health
```

Returns server health status.

### Root

```
GET /
```

Returns API information.

### Authentication

```
POST /api/v1/auth/google
POST /api/v1/auth/watch
GET /api/v1/me
```

### User Management

```
POST /api/v1/users
PUT /api/v1/users/onboarding
POST /api/v1/onboarding/complete
POST /api/v1/users/fcm-token
```

### User Profile

```
POST /api/v1/user-profiles
```

### Health Data

```
POST /api/v1/health-data/batch
GET /api/v1/health-data
```

### Reset Sessions

```
POST /api/v1/reset-sessions
GET /api/v1/reset-sessions
```

### User Settings

```
GET /api/v1/user-settings
PUT /api/v1/user-settings
```

### App Constants

```
GET /api/v1/app-constants
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── constants/       # App constants
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validators/      # Request validators
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
├── .env.example         # Environment variables template
├── eslint.config.js     # ESLint configuration
├── package.json
├── render.yaml          # Render deployment configuration
└── README.md            # This file
```

## Troubleshooting

### Check Deployment Logs

In Render dashboard:
1. Go to your service
2. Click "Logs" tab
3. Look for error messages

### Run Production Readiness Check

Before deploying, run the verification script:

```bash
cd backend
./verify-production-ready.sh
```

## Common Issues and Solutions

### Issue 1: MongoDB Connection Failed

**Error:** `MongoDB connection failed: MongoServerError: bad auth`

**Solutions:**

1. Verify MongoDB Atlas credentials
2. Check IP whitelist includes `0.0.0.0/0`
3. Verify connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```
4. Ensure password is URL-encoded
5. Test connection locally:
   ```bash
   mongosh "mongodb+srv://username:password@cluster.mongodb.net/Pause"
   ```

### Issue 2: Firebase Initialization Failed

**Error:** `Failed to initialize Firebase: Error: Invalid service account`

**Solutions:**

1. Verify all three Firebase environment variables are set
2. Check private key format:
   - Must include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - Must have `\n` as literal text (backslash-n), not actual newlines
   - Must be wrapped in double quotes
3. Re-download service account key from Firebase Console
4. For local development, use file path:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   ```

### Issue 3: JWT Secret Validation Error

**Error:** `JWT_SECRET must be at least 32 characters long`

**Solution:**

Generate a new secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update `JWT_SECRET` in Render environment variables.

### Issue 4: CORS Errors

**Error:** `Access to fetch has been blocked by CORS policy`

**Solutions:**

1. Add your frontend URL to `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
   ```
2. For multiple origins, use comma-separated list (no spaces)
3. For testing only, allow all origins: `ALLOWED_ORIGINS=*`
4. Ensure protocol is included: `https://yourapp.com`
5. No trailing slashes

### Issue 5: Build Fails on Render

**Error:** `Build failed: npm ERR! code ELIFECYCLE`

**Solutions:**

1. Check Node version in `package.json`:
   ```json
   "engines": {
     "node": ">=18.0.0",
     "npm": ">=9.0.0"
   }
   ```
2. Clear build cache in Render dashboard
3. Check for missing dependencies
4. Review build logs for specific errors

### Issue 6: Server Crashes on Startup

**Error:** `Application failed to respond`

**Solutions:**

1. Check environment variables: `npm run validate`
2. Review startup logs for errors
3. Verify MongoDB connection
4. Check port configuration: `PORT=10000`
5. Run linting: `npm run lint:check`

### Issue 7: Health Check Fails

**Error:** `Health check failed`

**Solutions:**

1. Verify health check path in `render.yaml`: `healthCheckPath: /health`
2. Test health endpoint: `curl https://your-app.onrender.com/health`
3. Check server is listening on `0.0.0.0:10000`
4. Review server startup logs

### Issue 8: Slow Response Times

**Causes:**
- Free tier server spins down after 15 minutes
- MongoDB connection not optimized
- Large response payloads

**Solutions:**

1. Upgrade to paid Render plan
2. Implement keep-alive ping (UptimeRobot)
3. Optimize MongoDB queries with indexes
4. Implement pagination
5. Enable response compression

### Issue 9: Environment Variable Not Found

**Error:** `Missing required environment variables`

**Solutions:**

1. In Render dashboard > Environment, add the missing variable
2. Verify variable name spelling (case-sensitive)
3. Check for typos in values
4. Restart service after adding variables

### Issue 10: Google OAuth Not Working

**Error:** `Invalid Google token`

**Solutions:**

1. Verify `GOOGLE_WEB_CLIENT_ID` matches Google Cloud Console
2. Check OAuth consent screen is published
3. Ensure token from mobile app is not expired
4. Enable "Google+ API" in Google Cloud Console

## License

ISC
