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

// Grounded search function using OpenAI o3 + Web Search
async function groundedSearch(query) {
  const today = new Date().toISOString().split('T')[0];
  const fullPrompt = `Today's date: ${today}\nQuery: ${query}`;
  
  try {
    const resp = await client.responses.create({
      model: 'o3-2025-04-16',
      input: fullPrompt,
      tools: [{ type: 'web_search' }],
      reasoning: { effort: 'low' },
      max_output_tokens: 1500,
    });

    // Return just the clean response text
    return resp.output_text || '';
  } catch (error) {
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

// Tool definition - only query parameter as required
const GROUNDED_SEARCH_TOOL = {
  name: "grounded_search",
  description: "Search for current information using OpenAI o3 with Web Search grounding",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for current information"
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
      const result = await groundedSearch(args.query);
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
  console.error('OpenAI o3 MCP server running');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});