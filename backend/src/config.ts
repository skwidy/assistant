import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from multiple files
// Order: .env.local (highest priority) -> .env -> .env.example (lowest priority)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.example') });

import * as fs from 'fs';

export interface AssistantConfig {
  id: string;
  name: string;
  description: string;
  assistantId: string;
  rateLimit?: {
    maxRequests: number;
    timeWindow: number; // in milliseconds
  };
  subdomain?: string; // optional custom subdomain
}

export interface AppConfig {
  assistants: Record<string, AssistantConfig>;
  defaultAssistant: string;
  globalRateLimit: {
    maxRequests: number;
    timeWindow: number;
  };
  apiKey?: string; // Optional global API key
  appName?: string; // Application name
}

// Helper function to inject environment variables in strings
function injectEnvVars(value: any): any {
  if (typeof value === 'string' && value.includes('${')) {
    return value.replace(/\${([^}]+)}/g, (match, envVar) => {
      const envValue = process.env[envVar];
      if (!envValue) {
        console.warn(`⚠️  Environment variable ${envVar} not found, using placeholder`);
        return match; // Keep the placeholder if env var not found
      }
      return envValue;
    });
  }
  return value;
}

// Load configuration from JSON file and inject environment variables
function loadConfigFromFile(): AppConfig {
  const configPath = path.join(__dirname, 'assistants.json');
  
  // Check if config file exists, otherwise use default
  let configData: any;
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    configData = JSON.parse(configContent);
  } catch (error) {
    console.warn('assistants.json not found, using default configuration');
    configData = {
      appName: 'AI Assistant',
      defaultAssistant: 'help',
      globalRateLimit: {
        maxRequests: 1000,
        timeWindow: 15 * 60 * 1000
      },
      assistants: {
        help: {
          id: 'help',
          name: 'AI Assistant',
          description: 'Get help with questions',
          openaiId: '${ASSISTANT_HELP_OPENAI_ID}',
          subdomain: 'help',
          rateLimit: {
            maxRequests: 100,
            timeWindow: 15 * 60 * 1000
          }
        }
      }
    };
  }

  // Process assistants and inject environment variables
  const assistants: Record<string, AssistantConfig> = {};
  const missingIds: string[] = [];
  
  for (const [key, assistant] of Object.entries(configData.assistants)) {
    const assistantData = assistant as any;
    
    // Inject environment variables in the openaiId
    const openaiId = injectEnvVars(assistantData.openaiId);
    
    // Check if the openaiId still contains placeholders (env vars not found)
    if (typeof openaiId === 'string' && openaiId.includes('${')) {
      const envVar = openaiId.match(/\${([^}]+)}/)?.[1];
      if (envVar) {
        missingIds.push(`${assistantData.id} (${envVar})`);
      }
      continue; // Skip this assistant if env var not found
    }
    
    if (!openaiId) {
      missingIds.push(`${assistantData.id} (openaiId not set)`);
      continue;
    }
    
    assistants[key] = {
      id: assistantData.id,
      name: assistantData.name,
      description: assistantData.description,
      assistantId: openaiId,
      rateLimit: assistantData.rateLimit,
      subdomain: assistantData.subdomain || assistantData.id,
    };
  }

  // Show error for missing environment variables
  if (missingIds.length > 0) {
    console.error('❌ Missing required environment variables for OpenAI Assistant IDs:');
    missingIds.forEach(id => console.error(`   - ${id}`));
    console.error('\n💡 Add these to your .env file:');
    missingIds.forEach(id => {
      const envVar = id.split(' (')[1].replace(')', '');
      console.error(`   ${envVar}=asst_your_actual_id_here`);
    });
    console.error('\n🔧 Or set them as environment variables in your deployment platform.');
    console.error('\n🔍 Debug: Available environment variables:');
    Object.keys(process.env).filter(key => key.includes('ASSISTANT')).forEach(key => {
      console.error(`   ${key}=${process.env[key] ? '***SET***' : 'NOT_SET'}`);
    });
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missingIds.join(', ')}`);
    }
  }

  // Inject environment variables in app-level config
  const appName = injectEnvVars(configData.appName);
  const defaultAssistant = injectEnvVars(configData.defaultAssistant);

  return {
    assistants,
    defaultAssistant: process.env.DEFAULT_ASSISTANT || defaultAssistant || Object.keys(assistants)[0] || 'help',
    globalRateLimit: {
      maxRequests: Number(process.env.GLOBAL_RATE_LIMIT_MAX) || configData.globalRateLimit?.maxRequests || 1000,
      timeWindow: Number(process.env.GLOBAL_RATE_LIMIT_WINDOW) || configData.globalRateLimit?.timeWindow || 15 * 60 * 1000,
    },
    apiKey: process.env.API_KEY,
    appName: process.env.APP_NAME || appName || 'AI Assistant',
  };
}

// Load configuration
export const defaultConfig = loadConfigFromFile();

// Helper function to get assistant config by ID
export function getAssistantConfig(assistantId: string): AssistantConfig | null {
  return defaultConfig.assistants[assistantId] || null;
}

// Helper function to get assistant config by subdomain
export function getAssistantBySubdomain(subdomain: string): AssistantConfig | null {
  return Object.values(defaultConfig.assistants).find(assistant => 
    assistant.subdomain === subdomain
  ) || null;
}

// Helper function to get all available assistants
export function getAllAssistants(): AssistantConfig[] {
  return Object.values(defaultConfig.assistants);
} 