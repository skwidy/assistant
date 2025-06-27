import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import auth from '@fastify/auth';
import OpenAI from 'openai';
import { defaultConfig, getAssistantConfig, getAllAssistants } from './config';

// Use the type from OpenAI package if available
// If not, fallback to 'any' for Message type
// type Message = any;
type Message = any;

// Extend FastifyRequest to include authenticate method
declare module 'fastify' {
  interface FastifyRequest {
    // authenticate(): Promise<void>; // Removed
  }
}

// CORS: Allow only your frontend domain in production, open in development
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_ORIGINS
        ? process.env.FRONTEND_ORIGINS.split(',').map(origin => origin.trim())
        : [])
    : true;

const fastify = Fastify({ logger: true });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Register plugins
fastify.register(cors, {
  origin: allowedOrigins,
  credentials: true,
});

// Global rate limiting
fastify.register(rateLimit, {
  max: defaultConfig.globalRateLimit.maxRequests,
  timeWindow: defaultConfig.globalRateLimit.timeWindow,
  errorResponseBuilder: function (request: FastifyRequest, context: any) {
    return {
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${context.after}`,
      retryAfter: context.after,
    };
  },
});

// Authentication hook
fastify.register(auth);

// Health check
fastify.get('/health', async (_request: FastifyRequest, _reply: FastifyReply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    appName: defaultConfig.appName,
    assistants: getAllAssistants().length
  };
});

// Get all available assistants
fastify.get('/assistants', async (_request: FastifyRequest, _reply: FastifyReply) => {
  const assistants = getAllAssistants().map(assistant => ({
    id: assistant.id,
    name: assistant.name,
    description: assistant.description,
    subdomain: assistant.subdomain,
  }));
  
  return {
    appName: defaultConfig.appName,
    assistants,
    defaultAssistant: defaultConfig.defaultAssistant,
  };
});

// Get assistant info by ID
fastify.get('/assistants/:assistantId/info', async (request: FastifyRequest<{ Params: { assistantId: string } }>, reply: FastifyReply) => {
  const { assistantId } = request.params;
  const config = getAssistantConfig(assistantId);
  
  if (!config) {
    return reply.code(404).send({ error: 'Assistant not found' });
  }
  
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    subdomain: config.subdomain,
  };
});

interface AskRequestBody {
  message: string;
  threadId?: string;
}

// Ask endpoint with assistant-specific routing
fastify.post('/assistants/:assistantId/ask', async (request: FastifyRequest<{ 
  Params: { assistantId: string },
  Body: AskRequestBody 
}>, reply: FastifyReply) => {
  try {
    const { assistantId } = request.params;
    const { message, threadId } = request.body;
    
    // Get assistant configuration
    const config = getAssistantConfig(assistantId);
    if (!config) {
      return reply.code(404).send({ error: 'Assistant not found' });
    }
    
    if (!message) {
      return reply.code(400).send({ error: 'Message is required' });
    }
    
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
    }
    
    await openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: message,
    });
    
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: config.assistantId,
    });
    
    let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
    }
    
    if (runStatus.status === 'failed') {
      return reply.code(500).send({
        error: 'Assistant run failed',
        details: runStatus.last_error,
      });
    }
    
    const messages = await openai.beta.threads.messages.list(currentThreadId);
    const assistantMessage = messages.data.find((msg: Message) => msg.role === 'assistant');
    
    if (!assistantMessage) {
      return reply.code(500).send({ error: 'No assistant response found' });
    }
    
    const content = assistantMessage.content[0];
    if (content.type !== 'text') {
      return reply.code(500).send({ error: 'Assistant response is not text' });
    }
    
    const replyText = content.text.value;
    return {
      reply: replyText,
      threadId: currentThreadId,
      assistantId: config.id,
    };
  } catch (error: any) {
    fastify.log.error(error);
    return reply.code(500).send({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Legacy endpoint for backward compatibility
fastify.post('/ask', async (request: FastifyRequest<{ Body: AskRequestBody }>, reply: FastifyReply) => {
  // Redirect to default assistant
  const defaultAssistant = getAssistantConfig(defaultConfig.defaultAssistant);
  if (!defaultAssistant) {
    return reply.code(500).send({ error: 'Default assistant not configured' });
  }
  
  // Forward to the assistant-specific endpoint
  return fastify.inject({
    method: 'POST',
    url: `/assistants/${defaultAssistant.id}/ask`,
    payload: request.body,
    headers: request.headers,
  });
});

// Legacy info endpoint for backward compatibility
fastify.get('/info', async (_request: FastifyRequest, _reply: FastifyReply) => {
  const defaultAssistant = getAssistantConfig(defaultConfig.defaultAssistant);
  return {
    name: defaultAssistant?.name || defaultConfig.appName,
  };
});

// Add a global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    error: 'Internal server error',
    message: error.message || 'An unexpected error occurred.'
  });
});

const start = async () => {
  try {
    const port = process.env.PORT ? Number(process.env.PORT) : 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
    fastify.log.info(`App: ${defaultConfig.appName}`);
    fastify.log.info(`Available assistants: ${getAllAssistants().map(a => `${a.name} (${a.subdomain}.domain.com)`).join(', ')}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 