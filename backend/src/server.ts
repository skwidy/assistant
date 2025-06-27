import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Use the type from OpenAI package if available
// If not, fallback to 'any' for Message type
// type Message = any;
type Message = any;

dotenv.config();

const fastify = Fastify({ logger: true });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

fastify.register(cors, {
  origin: true,
  credentials: true,
});

fastify.get('/health', async (_request: FastifyRequest, _reply: FastifyReply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

interface AskRequestBody {
  message: string;
  threadId?: string;
}

fastify.post('/ask', async (request: FastifyRequest<{ Body: AskRequestBody }>, reply: FastifyReply) => {
  try {
    const { message, threadId } = request.body;
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
      assistant_id: process.env.ASSISTANT_ID!,
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
    };
  } catch (error: any) {
    fastify.log.error(error);
    return reply.code(500).send({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

const start = async () => {
  try {
    const port = process.env.PORT ? Number(process.env.PORT) : 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 