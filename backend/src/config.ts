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
  
  // Check if config file exists, otherwise throw error
  let configData: any;
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    configData = JSON.parse(configContent);
  } catch (error) {
    console.error('❌ assistants.json not found or invalid. The application cannot start without it.');
    throw error;
  }

  // Process assistants and inject environment variables
  const assistants: Record<string, AssistantConfig> = {};
  const missingIds: string[] = [];
  
  // Inject environment variables in assistant openaiIds before checking for missing ones
  for (const [key, assistant] of Object.entries(configData.assistants)) {
    const a = assistant as any;
    a.openaiId = injectEnvVars(a.openaiId);
  }
  // Now check for missing openaiId env vars
  for (const [key, assistant] of Object.entries(configData.assistants)) {
    const a = assistant as any;
    if (typeof a.openaiId === 'string' && a.openaiId.includes('${')) {
      throw new Error(`❌ Environment variable for assistant '${key}' openaiId is missing. Please set it in your environment.`);
    }
  }
  
  for (const [key, assistant] of Object.entries(configData.assistants)) {
    const assistantData = assistant as any;
    
    // Check if the openaiId still contains placeholders (env vars not found)
    if (typeof assistantData.openaiId === 'string' && assistantData.openaiId.includes('${')) {
      const envVar = assistantData.openaiId.match(/\${([^}]+)}/)?.[1];
      if (envVar) {
        missingIds.push(`${assistantData.id} (${envVar})`);
      }
      continue; // Skip this assistant if env var not found
    }
    
    if (!assistantData.openaiId) {
      missingIds.push(`${assistantData.id} (openaiId not set)`);
      continue;
    }
    
    assistants[key] = {
      id: assistantData.id,
      name: assistantData.name,
      description: assistantData.description,
      assistantId: assistantData.openaiId,
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

  // Use environment variables for app-level config, fail if missing
  if (!process.env.APP_NAME) {
    throw new Error('❌ APP_NAME environment variable is required.');
  }
  if (!process.env.DEFAULT_ASSISTANT) {
    throw new Error('❌ DEFAULT_ASSISTANT environment variable is required.');
  }
  if (!configData.assistants || Object.keys(configData.assistants).length === 0) {
    throw new Error('❌ assistants.json must define at least one assistant.');
  }
  const appName = process.env.APP_NAME;
  const defaultAssistant = process.env.DEFAULT_ASSISTANT;
  const globalRateLimit = {
    maxRequests: Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 1000,
    timeWindow: Number(process.env.GLOBAL_RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  };

  return {
    assistants,
    defaultAssistant,
    globalRateLimit,
    apiKey: process.env.API_KEY,
    appName,
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