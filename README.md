# Multi-Assistant Chat Platform

A flexible, open-source platform for deploying multiple AI assistants with subdomain-based routing, rate limiting, and optional authentication.

## Features

- 🚀 **Multiple Assistants** - Deploy unlimited AI assistants
- 🌐 **Subdomain Routing** - Each assistant gets its own subdomain
- ⚡ **Rate Limiting** - Built-in protection against abuse
- 🔐 **Optional Authentication** - API key protection
- 💾 **Conversation Memory** - Persistent chat threads
- 🎨 **Modern UI** - Clean, responsive interface
- 🔧 **JSON Configuration** - Easy to edit assistant settings

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd assistant
npm install
```

### 2. Create Your Assistants

Create assistants in OpenAI and note their IDs.

### 3. Configure Assistants

Edit `backend/src/assistants.json`:

```json
{
  "appName": "My AI Platform",
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

### 4. Set Environment Variables

Create environment files in the backend directory. The backend loads them in this order (later files override earlier ones):

1. `.env.example` (lowest priority - templates)
2. `.env` (shared configuration)
3. `.env.local` (highest priority - local overrides)

**Example `.env` file:**
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Required: OpenAI Assistant IDs (referenced in assistants.json)
ASSISTANT_HELP_OPENAPI_ID=asst_actual_help_id
ASSISTANT_MARKETING_OPENAPI_ID=asst_actual_marketing_id

# Optional: API Key for authentication
API_KEY=your-optional-api-key

# Optional: Override app settings
APP_NAME=My Custom Platform
DEFAULT_ASSISTANT=help
GLOBAL_RATE_LIMIT_MAX=1000
GLOBAL_RATE_LIMIT_WINDOW=900000

# Server Configuration
PORT=3001
```

**Example `.env.local` file (for local development):**
```bash
# Local overrides
OPENAI_API_KEY=sk-your-local-key
ASSISTANT_HELP_OPENAPI_ID=asst_local_help_id
```

### 5. Deploy

#### Backend (Railway/Render/Heroku)
```bash
cd backend
npm run build
npm start
```

#### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
npm start
```

### 6. Configure DNS

Set up subdomains pointing to your deployments:
```
help.yourdomain.com     → Frontend
marketing.yourdomain.com → Frontend
api.yourdomain.com      → Backend
```

## Configuration

### JSON Configuration File (`backend/src/assistants.json`)

The main configuration file where you define your assistants. Use `${ENV_VAR}` syntax to inject environment variables:

```json
{
  "appName": "My AI Platform",
  "defaultAssistant": "help",
  "globalRateLimit": {
    "maxRequests": 1000,
    "timeWindow": 900000
  },
  "assistants": {
    "assistant_id": {
      "id": "assistant_id",
      "name": "Display Name",
      "description": "Description",
      "openaiId": "${ASSISTANT_ASSISTANT_ID_OPENAPI_ID}",
      "subdomain": "subdomain",
      "rateLimit": {
        "maxRequests": 100,
        "timeWindow": 900000
      }
    }
  }
}
```

### Environment Variables

Only sensitive data needs environment variables. The JSON file references them using `${ENV_VAR}` syntax:

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `ASSISTANT_{ID}_OPENAPI_ID` | OpenAI Assistant ID | `ASSISTANT_HELP_OPENAPI_ID=asst_abc123` |
| `API_KEY` | Optional API key for auth | `your-api-key` |
| `APP_NAME` | Override app name | `My Platform` |
| `DEFAULT_ASSISTANT` | Override default assistant | `help` |

### Rate Limiting

- **Global**: Set in JSON config or `GLOBAL_RATE_LIMIT_MAX`/`GLOBAL_RATE_LIMIT_WINDOW`
- **Per Assistant**: Set in JSON config under each assistant
- **Example**: `"timeWindow": 900000` = 15 minutes

## API Endpoints

### Get All Assistants
```bash
GET /assistants
```

### Get Assistant Info
```bash
GET /assistants/{assistantId}/info
```

### Send Message
```bash
POST /assistants/{assistantId}/ask
```

### Legacy Endpoints (Backward Compatible)
```bash
POST /ask
GET /info
```

## Adding New Assistants

1. **Create in OpenAI**: Create a new assistant in OpenAI
2. **Edit JSON Config**: Add to `backend/src/assistants.json`:
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
3. **Set Environment Variable**: Add to your `.env` file:
   ```bash
   ASSISTANT_SUPPORT_OPENAPI_ID=asst_actual_support_id
   ```
4. **Deploy Backend**: Restart with new configuration
5. **Add DNS Record**: `support.yourdomain.com` → Frontend
6. **Done!** Users can now access `support.yourdomain.com`

## Authentication

Set `API_KEY` environment variable to enable authentication:

```bash
# Frontend automatically includes the key
# External API calls require:
X-API-Key: your-api-key
# or
Authorization: Bearer your-api-key
```

## Customization

### Frontend Styling
- Edit `frontend/app/globals.css` for global styles
- Modify `frontend/components/ui/` for component styling
- Update `frontend/tailwind.config.js` for theme customization

### Backend Configuration
- Modify `backend/src/config.ts` for advanced configuration
- Update rate limiting in `backend/src/assistants.json`
- Add middleware in `backend/src/server.ts`

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Testing
```bash
cd backend
npm test
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Check that all `ASSISTANT_*_OPENAPI_ID` variables are set
2. **CORS Errors**: Backend is configured to allow all origins by default
3. **Rate Limiting**: Check your rate limit settings in the JSON config
4. **Authentication**: Ensure `API_KEY` is set if using authentication

### Debug Mode

The backend will show detailed error messages in development mode, including:
- Missing environment variables
- Configuration validation errors
- Available environment variables

## License

MIT License - see LICENSE file for details.