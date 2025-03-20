# PurplePay Backend Deployment Guide

This guide will help you deploy the PurplePay backend to a production environment.

## Prerequisites

- Node.js v18 or later
- MongoDB database (Atlas or other hosted solution)
- Git

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=9882
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>
JWT_SECRET=your-jwt-secret
```

Replace the `MONGODB_URI` with your actual MongoDB connection string.

## Deployment Options

### Option 1: Deploy to Render

1. Create a new Web Service on Render.com
2. Connect to your GitHub repository
3. Set the following build settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
4. Add environment variables:
   - `PORT`: 10000 (Render will expose this port)
   - `NODE_ENV`: production
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT token signing

### Option 2: Deploy to Railway

1. Create a new project on Railway.app
2. Connect to your GitHub repository
3. Add a MongoDB database from the Railway dashboard
4. Railway will automatically detect the build and start commands
5. Add other required environment variables:
   - `NODE_ENV`: production
   - `JWT_SECRET`: A secure random string for JWT token signing

### Option 3: Manual Deployment

1. Clone the repository
2. Set environment variables or create a `.env` file
3. Install dependencies:
   ```
   npm install
   ```
4. Build the TypeScript code:
   ```
   npm run build
   ```
5. Start the server:
   ```
   npm run start
   ```

## Verifying Deployment

Once deployed, access the health check endpoint:

```
GET /api/health
```

It should return a status indicating that both the API and database are up.

## Setting Up MongoDB Atlas (Free Tier)

1. Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new project
3. Build a new cluster (free tier is sufficient)
4. Create a database user with password authentication
5. Whitelist IP addresses (use 0.0.0.0/0 for public access from anywhere)
6. Get the connection string from the "Connect" button
7. Replace `<username>`, `<password>`, and `<database-name>` in the connection string

## Setting Up Database Indexes

After your first deployment, make sure to create appropriate indexes for your collections to optimize performance.
