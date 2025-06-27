# AI Assistant

A production-grade chat interface powered by OpenAI's Assistants API.

## 🏗️ Project Structure

- **Frontend**: Next.js (TypeScript) app
- **Backend**: Fastify (TypeScript) API
- **UI**: shadcn/ui + Tailwind CSS
- **Storage**: localStorage for session management

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
# Add your OPENAI_API_KEY and ASSISTANT_ID to .env
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Update NEXT_PUBLIC_API_URL in .env.local if needed
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=sk-your-openai-api-key-here
ASSISTANT_ID=asst_your-assistant-id-here
PORT=3001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🎯 Features

- ✅ Chat interface with OpenAI Assistants API
- ✅ Thread-based conversation persistence
- ✅ Markdown and code block rendering
- ✅ Reset chat functionality
- ✅ Responsive design with shadcn/ui
- ✅ Full TypeScript support
- ✅ Production-ready deployment setup

## 🚀 Deployment

### Backend (Railway)
- Deploy `backend/` directory
- Set environment variables
- Domain: `assistant-api.domain.com`

### Frontend (Railway)
- Deploy `frontend/` directory
- Set `NEXT_PUBLIC_API_URL` environment variable
- Domain: `assistant.domain.com`

## 🧪 Testing

The application supports:
- New thread creation on first message
- Thread persistence across sessions
- Markdown and code rendering
- Chat reset functionality
- Responsive design across devices 