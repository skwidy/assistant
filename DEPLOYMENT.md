# Deployment Guide

This guide will help you deploy the Assistant to Railway.

## 🚀 Backend Deployment

### 1. Create Railway Project
1. Go to [Railway](https://railway.app)
2. Create a new project
3. Choose "Deploy from GitHub repo"
4. Select your repository and the `backend/` directory

### 2. Environment Variables
Add these environment variables in Railway:
```
OPENAI_API_KEY=sk-your-openai-api-key-here
ASSISTANT_ID=asst-your-assistant-id-here
PORT=3001
```

### 3. Deploy
Railway will automatically deploy when you push to your repository.

### 4. Get Domain
Railway will provide a domain like `https://your-app-name.railway.app`

## 🌐 Frontend Deployment

### 1. Create Railway Project
1. Create another Railway project
2. Choose "Deploy from GitHub repo"
3. Select your repository and the `frontend/` directory

### 2. Environment Variables
Add this environment variable:
```
NEXT_PUBLIC_API_URL=https://your-backend-app-name.railway.app
```

### 3. Deploy
Railway will automatically deploy when you push to your repository.

### 4. Custom Domain (Optional)
1. Go to your Railway project settings
2. Add custom domain: `assistant.domain.com`
3. Update your DNS records as instructed

## 🔧 Backend Custom Domain

1. Go to your backend Railway project settings
2. Add custom domain: `assistant-api.domain.com`
3. Update your DNS records as instructed

## ✅ Verification

1. Test backend health: `https://assistant-api.domain.com/health`
2. Test frontend: `https://assistant.domain.com`
3. Try sending a message in the chat interface

## 🐛 Troubleshooting

### Backend Issues
- Check Railway logs for errors
- Verify environment variables are set correctly
- Ensure OpenAI API key is valid

### Frontend Issues
- Check Railway logs for build errors
- Verify `NEXT_PUBLIC_API_URL` points to correct backend
- Check browser console for API errors

### CORS Issues
- Backend CORS is configured to allow all origins
- If issues persist, check Railway domain configuration 