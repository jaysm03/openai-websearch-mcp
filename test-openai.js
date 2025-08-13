#!/usr/bin/env node

import OpenAI from 'openai';

// Simple test function
async function testGroundedSearch(query) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  const today = new Date().toISOString().split('T')[0];
  const fullPrompt = `Today's date: ${today}\nQuery: ${query}`;
  
  try {
    const resp = await client.responses.create({
      model: 'o3-2025-04-16',
      input: fullPrompt,
      tools: [{ type: 'web_search' }],
      reasoning: { effort: 'medium' },
      max_output_tokens: 2000,
    });

    return resp.output_text || '';
  } catch (error) {
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

// Run the test
const query = process.argv[2] || 'windsurf ide news';

testGroundedSearch(query)
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });