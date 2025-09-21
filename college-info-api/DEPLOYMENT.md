# Render Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. **GitHub Repository**
- ✅ Push all code to GitHub
- ✅ Make sure `.env` is in `.gitignore`
- ✅ Test locally one more time

### 2. **MongoDB Atlas**
- ✅ Whitelist IP: `0.0.0.0/0` (all IPs) for Render
- ✅ Copy connection string

## 🚀 Render Deployment Steps

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your `college-info-api` repository

### Step 3: Configure Service
**Basic Settings:**
- **Name**: `college-info-api` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (or `college-info-api` if in subfolder)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 4: Environment Variables
Add these in Render dashboard:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college-info
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!
NODE_ENV=production
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Get your URL: `https://your-app-name.onrender.com`

## 🔧 Post-Deployment

### Update Swagger URL
Update `swagger.yaml` with your actual Render URL:
```yaml
servers:
  - url: https://your-actual-app-name.onrender.com
```

### Test Endpoints
1. **API Docs**: `https://your-app-name.onrender.com/api-docs`
2. **Public API**: `https://your-app-name.onrender.com/colleges`
3. **Admin Login**: Test with Postman using your Render URL

## ⚠️ Important Notes

### **Free Tier Limitations:**
- **Sleep Mode**: Service sleeps after 15 minutes of inactivity
- **Cold Start**: First request after sleep takes 30-60 seconds
- **Monthly Hours**: 750 hours/month limit

### **Database Considerations:**
- Use MongoDB Atlas (free tier available)
- Ensure IP whitelist includes `0.0.0.0/0`
- Connection string must be production-ready

### **Performance Tips:**
- **Keep Alive**: Consider adding a health check endpoint
- **Logging**: Monitor Render logs for errors
- **CORS**: Already configured for all origins

## 🔍 Troubleshooting

### Common Issues:
1. **Build Fails**: Check Node version in `package.json`
2. **Database Connection**: Verify MongoDB Atlas IP whitelist
3. **Environment Variables**: Double-check all variables are set
4. **Swagger UI**: Update server URLs after deployment

### Useful Commands:
```bash
# Check logs in Render dashboard
# Or use Render CLI
render logs
```

## 📱 After Deployment

Your API will be available at:
- **Base URL**: `https://your-app-name.onrender.com`
- **API Docs**: `https://your-app-name.onrender.com/api-docs`
- **Admin Panel**: Use Postman with your Render URL

### Example Usage:
```javascript
// Frontend integration
const API_BASE = 'https://your-app-name.onrender.com';

// Get colleges
fetch(`${API_BASE}/colleges?district=Kalaburgi`)
  .then(res => res.json())
  .then(data => console.log(data));
```

## 🎉 Success!
Your College Info API is now live and accessible worldwide!
