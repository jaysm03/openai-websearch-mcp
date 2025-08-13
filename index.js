#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import OpenAI from 'openai';

// Initialize OpenAI client
let client;

async function initializeOpenAI() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    // Configure OpenAI client with explicit timeout settings
    // 15 minutes (900000ms) timeout based on OpenAI's recommendations for complex Responses API calls
    // This prevents premature timeouts during high reasoning effort requests
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 900000, // 15 minutes in milliseconds
      maxRetries: 2
    });
    console.error('OpenAI client initialized successfully with 15-minute timeout');
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    process.exit(1);
  }
}

// Grounded search function with configurable model and reasoning effort
async function groundedSearch(query, model = 'o3-2025-04-16', reasoningEffort = 'low') {
  const today = new Date().toISOString().split('T')[0];
  const fullPrompt = `Today's date: ${today}\nQuery: ${query}`;
  
  // Track request start time for duration logging
  const startTime = Date.now();
  
  // Set token limits based on reasoning effort to prevent truncation
  let maxTokens;
  switch (reasoningEffort) {
    case 'low':
      maxTokens = 4000;
      break;
    case 'medium':
      maxTokens = 8000;
      break;
    case 'high':
      maxTokens = 16000;
      break;
    default:
      maxTokens = 4000;
  }
  
  // Log selection for transparency
  console.error(`Starting request - Model: ${model} | Reasoning effort: ${reasoningEffort} | Query length: ${query.length} chars | Max tokens: ${maxTokens}`);
  
  // Configure service tier for high/maximum reasoning effort requests
  // Flex processing helps handle computationally intensive requests
  
  const requestConfig = {
    model: model,
    input: fullPrompt,
    tools: [{ type: 'web_search' }],
    reasoning: { effort: reasoningEffort },
    max_output_tokens: maxTokens,
  };
  
  // Add flex service tier for medium and high reasoning effort to improve reliability
  if (reasoningEffort === 'medium' || reasoningEffort === 'high') {
    requestConfig.service_tier = 'flex';
    console.error(`Using flex service tier for ${reasoningEffort} reasoning effort`);
  }
  
  try {
    const resp = await client.responses.create(requestConfig);
    
    // Log successful completion with duration
    const duration = Date.now() - startTime;
    console.error(`Request completed successfully in ${duration}ms`);

    // Return just the clean response text
    return resp.output_text || '';
  } catch (error) {
    // Log error with duration
    const duration = Date.now() - startTime;
    console.error(`Request failed after ${duration}ms: ${error.message}`);
    
    // Fallback to o3 if specified model is not available
    if (error.message.includes('model') && model !== 'o3-2025-04-16') {
      console.error(`Model ${model} not available, falling back to o3`);
      try {
        const fallbackConfig = {
          model: 'o3-2025-04-16',
          input: fullPrompt,
          tools: [{ type: 'web_search' }],
          reasoning: { effort: reasoningEffort },
          max_output_tokens: maxTokens,
        };
        
        // Apply flex service tier to fallback if needed
        if (reasoningEffort === 'medium' || reasoningEffort === 'high') {
          fallbackConfig.service_tier = 'flex';
        }
        
        const fallbackStartTime = Date.now();
        const fallbackResp = await client.responses.create(fallbackConfig);
        const fallbackDuration = Date.now() - fallbackStartTime;
        console.error(`Fallback request completed in ${fallbackDuration}ms`);
        
        return fallbackResp.output_text || '';
      } catch (fallbackError) {
        const fallbackDuration = Date.now() - startTime;
        console.error(`Fallback request failed after ${fallbackDuration}ms: ${fallbackError.message}`);
        throw new Error(`OpenAI API error: ${fallbackError.message}`);
      }
    }
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

// Create MCP server
const server = new Server(
  {
    name: "openai-o3-grounded-search",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definition with optional model and reasoning effort parameters
const GROUNDED_SEARCH_TOOL = {
  name: "grounded_search",
  description: "Search for current information using OpenAI models (GPT-5, O3, Deep Research) with Web Search grounding. The AI can specify model and reasoning effort based on query complexity. Deep Research models provide enhanced research capabilities for complex queries.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for current information"
      },
      model: {
        type: "string",
        description: "OpenAI model to use. Options: 'gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'o3-2025-04-16', 'o3-deep-research', 'o4-mini-deep-research'. Deep Research models provide advanced research capabilities. Defaults to 'o3-2025-04-16'",
        enum: ["gpt-5", "gpt-5-mini", "gpt-5-nano", "o3-2025-04-16", "o3-deep-research", "o4-mini-deep-research"],
        default: "o3-2025-04-16"
      },
      reasoning_effort: {
        type: "string",
        description: "Reasoning effort level. Options: 'low', 'medium', 'high'. Defaults to 'low'",
        enum: ["low", "medium", "high"],
        default: "low"
      }
    },
    required: ["query"]
  }
};

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [GROUNDED_SEARCH_TOOL]
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "grounded_search") {
    try {
      const result = await groundedSearch(
        args.query, 
        args.model || 'o3-2025-04-16', 
        args.reasoning_effort || 'low'
      );
      return {
        content: [{ type: "text", text: result }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Start server
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }
  
  await initializeOpenAI();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenAI GPT-5/O3 MCP server running');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});