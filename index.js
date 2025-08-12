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
    
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.error('OpenAI client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    process.exit(1);
  }
}

// Grounded search function with configurable model and reasoning effort
async function groundedSearch(query, model = 'o3-2025-04-16', reasoningEffort = 'low') {
  const today = new Date().toISOString().split('T')[0];
  const fullPrompt = `Today's date: ${today}\nQuery: ${query}`;
  
  // Log selection for transparency
  console.error(`Using model: ${model} | Reasoning effort: ${reasoningEffort}`);
  
  try {
    const resp = await client.responses.create({
      model: model,
      input: fullPrompt,
      tools: [{ type: 'web_search' }],
      reasoning: { effort: reasoningEffort },
      max_output_tokens: 2000,
    });

    // Return just the clean response text
    return resp.output_text || '';
  } catch (error) {
    // Fallback to o3 if specified model is not available
    if (error.message.includes('model') && model !== 'o3-2025-04-16') {
      console.error(`Model ${model} not available, falling back to o3`);
      try {
        const fallbackResp = await client.responses.create({
          model: 'o3-2025-04-16',
          input: fullPrompt,
          tools: [{ type: 'web_search' }],
          reasoning: { effort: reasoningEffort },
          max_output_tokens: 2000,
        });
        return fallbackResp.output_text || '';
      } catch (fallbackError) {
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
  description: "Search for current information using OpenAI models (GPT-5, O3) with Web Search grounding. The AI can specify model and reasoning effort based on query complexity.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for current information"
      },
      model: {
        type: "string",
        description: "OpenAI model to use. Options: 'gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'o3-2025-04-16'. Defaults to 'o3-2025-04-16'",
        enum: ["gpt-5", "gpt-5-mini", "gpt-5-nano", "o3-2025-04-16"],
        default: "o3-2025-04-16"
      },
      reasoning_effort: {
        type: "string",
        description: "Reasoning effort level. Options: 'low', 'medium', 'high', 'maximum'. Defaults to 'low'",
        enum: ["low", "medium", "high", "maximum"],
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