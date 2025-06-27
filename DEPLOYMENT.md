# Deployment Guide

## Multi-Assistant Setup

This application supports multiple assistants through subdomains using JSON configuration:

- `help.yourdomain.com` → Help Assistant (platform usage)
- `marketing.yourdomain.com` → Marketing Assistant (services info)
- `yourdomain.com` → Defaults to Help Assistant

## Configuration

### JSON Configuration (`backend/src/assistants.json`)

The main configuration file defines all assistants:

```json
{
  "appName": "AI Assistant",
  "defaultAssistant": "help",
  "globalRateLimit": {
    "maxRequests": 1000,
    "timeWindow": 900000
  },
  "assistants": {
    "help": {
      "id": "help",
      "name": "Help Assistant",
      "description": "Get help with our platform",
      "openaiId": "${ASSISTANT_HELP_OPENAPI_ID}",
      "subdomain": "help",
      "rateLimit": {
        "maxRequests": 100,
        "timeWindow": 900000
      }
    },
    "marketing": {
      "id": "marketing",
      "name": "Marketing Assistant",
      "description": "Learn about our services",
      "openaiId": "${ASSISTANT_MARKETING_OPENAPI_ID}",
      "subdomain": "marketing",
      "rateLimit": {
        "maxRequests": 50,
        "timeWindow": 900000
      }
    }
  }
}
```

### Environment Variables

#### Backend (.env)
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Assistant IDs (create these in OpenAI)
ASSISTANT_HELP_OPENAPI_ID=asst_help_assistant_id
ASSISTANT_MARKETING_OPENAPI_ID=asst_marketing_assistant_id

# Optional: API Key for authentication
API_KEY=your_optional_api_key

# Optional: Override app settings
APP_NAME=My Custom Platform
DEFAULT_ASSISTANT=help
GLOBAL_RATE_LIMIT_MAX=1000
GLOBAL_RATE_LIMIT_WINDOW=900000

# Server Configuration
PORT=3001
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## DNS Configuration

Set up the following DNS records:

```
help.yourdomain.com     → Frontend (Vercel/Netlify)
marketing.yourdomain.com → Frontend (Vercel/Netlify)  
api.yourdomain.com      → Backend (Railway/Render)
```

## Deployment Steps

### 1. Backend Deployment
1. Deploy to Railway/Render/Heroku
2. Set environment variables
3. Note the deployment URL (e.g., `https://api.yourdomain.com`)

### 2. Frontend Deployment
1. Deploy to Vercel/Netlify
2. Set `NEXT_PUBLIC_API_URL` environment variable
3. Configure custom domains for each subdomain

### 3. DNS Setup
1. Add CNAME records for each subdomain
2. Point to your frontend deployment
3. Add CNAME for API subdomain pointing to backend

## Rate Limiting

The application includes built-in rate limiting:
- Global: 1000 requests per 15 minutes
- Help Assistant: 100 requests per 15 minutes  
- Marketing Assistant: 50 requests per 15 minutes

## Authentication (Optional)

If you set an `API_KEY` environment variable:
- API requests require `X-API-Key` header
- Frontend requests are automatically authenticated
- External API usage requires the key

## Adding New Assistants

1. Create assistant in OpenAI
2. Add to `backend/src/assistants.json`:
```json
"support": {
  "id": "support",
  "name": "Support Assistant",
  "description": "Technical support",
  "openaiId": "${ASSISTANT_SUPPORT_OPENAPI_ID}",
  "subdomain": "support",
  "rateLimit": {
    "maxRequests": 75,
    "timeWindow": 900000
  }
}
```
3. Add environment variable: `ASSISTANT_SUPPORT_OPENAPI_ID=asst_...`
4. Deploy backend
5. Add DNS record: `support.yourdomain.com`

## 🚀 Backend Deployment

### 1. Create Railway Project
1. Go to [Railway](https://railway.app)
2. Create a new project
3. Choose "Deploy from GitHub repo"
4. Select your repository and the `backend/` directory

### 2. Environment Variables
Add these environment variables in Railway:
```
OPENAI_API_KEY=sk-your-openai-api-key
ASSISTANT_HELP_OPENAPI_ID=asst-your-assistant-id-here
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
- Check that all `ASSISTANT_*_OPENAPI_ID` variables are set

### Frontend Issues
- Check Railway logs for build errors
- Verify `NEXT_PUBLIC_API_URL` points to correct backend
- Check browser console for API errors

### CORS Issues
- Backend CORS is configured to allow all origins
- If issues persist, check Railway domain configuration

### Configuration Issues
- Ensure `assistants.json` is properly formatted
- Check that environment variable names match the JSON config
- Verify all required environment variables are set 