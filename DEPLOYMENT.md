# Deployment Guide

This guide will help you deploy your Task Management System to Vercel (frontend) and Render (backend).

## Prerequisites

1. **GitHub Account**: Your code should be pushed to GitHub
2. **MongoDB Atlas Account**: For cloud database
3. **Vercel Account**: For frontend hosting
4. **Render Account**: For backend hosting

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Create a database user with read/write permissions
4. Get your connection string
5. Add your IP address to the whitelist (or use 0.0.0.0/0 for all IPs)

## Step 2: Deploy Backend to Render

### Option A: Using Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `task-management-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `NODE_ENV`: `production`
   - `PORT`: `8000` (Render will override this)

6. Click "Create Web Service"
7. Wait for deployment to complete
8. Copy your service URL (e.g., `https://task-management-api.onrender.com`)

### Option B: Using render.yaml (Recommended)

1. The `render.yaml` file is already configured in the `server/` directory
2. Push your code to GitHub
3. In Render Dashboard, create a new "Blueprint" service
4. Connect your repository
5. Render will automatically detect and use the `render.yaml` configuration
6. Add your `MONGO_URI` environment variable
7. Deploy

## Step 3: Deploy Frontend to Vercel

### Option A: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

5. Add Environment Variables:
   - `REACT_APP_API_URL`: Your Render backend URL (e.g., `https://task-management-api.onrender.com`)

6. Click "Deploy"
7. Wait for deployment to complete
8. Copy your frontend URL (e.g., `https://task-management-system.vercel.app`)

### Option B: Using Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to the `client` directory: `cd client`
3. Run: `vercel`
4. Follow the prompts to configure your project
5. Add environment variables in the Vercel dashboard

## Step 4: Update CORS Configuration

After getting your frontend URL, update the backend CORS configuration:

1. Go to your Render service dashboard
2. Add environment variable:
   - `FRONTEND_URL`: Your Vercel frontend URL
3. Update the CORS configuration in `server/index.js`:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:3000'],
  credentials: true
}));
```

4. Redeploy the backend service

## Step 5: Test Your Deployment

1. Visit your frontend URL
2. Try creating a project and adding tasks
3. Check that data persists (MongoDB connection)
4. Test all features: drag & drop, filtering, dark mode, etc.

## Environment Variables Summary

### Frontend (Vercel)
```
REACT_APP_API_URL=https://your-backend-domain.onrender.com
```

### Backend (Render)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your frontend URL is correctly set in the backend CORS configuration
2. **MongoDB Connection**: Verify your connection string and IP whitelist
3. **Build Failures**: Check that all dependencies are in package.json
4. **Environment Variables**: Ensure they're set correctly in both platforms

### Debugging

1. Check Render logs for backend errors
2. Check Vercel build logs for frontend issues
3. Use browser developer tools to check API calls
4. Verify environment variables are loaded correctly

## Security Considerations

1. **MongoDB Atlas**: Use strong passwords and limit IP access
2. **Environment Variables**: Never commit sensitive data to Git
3. **CORS**: Only allow your frontend domain in production
4. **HTTPS**: Both Vercel and Render provide SSL certificates

## Cost

- **Vercel**: Free tier includes unlimited deployments
- **Render**: Free tier includes 750 hours/month
- **MongoDB Atlas**: Free tier includes 512MB storage

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/) 