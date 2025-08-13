# OpenAI Multi-Model MCP Server with Web Search Grounding

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--5%20%26%20O3-blue.svg)](https://openai.com/)

## Overview

A production-ready MCP (Model Context Protocol) server that integrates OpenAI's latest models (O3, GPT-5 family) with real-time web search capabilities. This implementation provides dynamic token limits, configurable reasoning effort levels, and robust timeout handling for enterprise deployment.

## Features

- **Multi-Model Support**: Access to O3-2025-04-16, GPT-5, GPT-5-mini, and GPT-5-nano models
- **Web Search Integration**: Real-time web search grounding for current information retrieval
- **Dynamic Token Management**: Automatic scaling based on reasoning effort (4k/8k/16k tokens)
- **Configurable Reasoning Effort**: Low, medium, and high reasoning levels for different use cases
- **Robust Timeout Handling**: Configurable timeouts with proper error recovery mechanisms
- **Source Attribution**: Automatic citation of web sources with URLs and titles
- **Production Ready**: Comprehensive error handling and performance optimizations

## Prerequisites

- Node.js 18.0.0 or higher
- OpenAI API key with access to GPT-5 and O3 models
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/[username]/openai-with-search-grounding
   cd openai_with_search_grounding
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Verify installation**
   ```bash
   node index.js
   ```
   Expected output: `OpenAI Multi-Model MCP server with web search grounding running`

## MCP Settings Configuration

### Environment Variables

Create a `.env` file in the project root:
```env
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### MCP Client Configuration

The MCP server operates on-demand and is automatically started by MCP clients when needed. Configure your MCP client with the following settings:

#### For Roo/Cline (VS Code)

**Configuration File Locations:**
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json`
- **Windows**: `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\mcp_settings.json`
- **Linux**: `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json`

**Complete Configuration:**
```json
{
  "mcpServers": {
    "openai-multi-model-grounded-search": {
      "command": "node",
      "args": [
        "/absolute/path/to/openai_with_search_grounding/index.js"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-your_openai_api_key_here"
      },
      "alwaysAllow": [
        "grounded_search"
      ],
      "timeout": 3600
    }
  }
}
```

#### For Claude Desktop

**Configuration File Locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Complete Configuration:**
```json
{
  "mcpServers": {
    "openai-multi-model-grounded-search": {
      "command": "node",
      "args": ["/absolute/path/to/openai_with_search_grounding/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your_openai_api_key_here"
      },
      "alwaysAllow": [
        "grounded_search"
      ]
    }
  }
}
```

**Important Configuration Notes:**
- Replace `/absolute/path/to/openai_with_search_grounding/` with the actual absolute path to your project directory
- Replace `sk-your_openai_api_key_here` with your actual OpenAI API key
- Use forward slashes (/) in paths, even on Windows
- The `timeout` parameter is optional and defaults to system settings
- Restart your MCP client after configuration changes

## Usage

### Available Tool

**`grounded_search`** - Search for current information using OpenAI models with web search grounding

**Parameters:**
- `query` (string, required): Search query for current information
- `model` (string, optional): Model selection - "gpt-5", "gpt-5-mini", "gpt-5-nano", "o3-2025-04-16" (default: "o3-2025-04-16")
- `reasoning_effort` (string, optional): Reasoning effort level - "low", "medium", "high" (default: "low")

### Usage Examples

#### Basic Search with Default Settings
```json
{
  "method": "tools/call",
  "params": {
    "name": "grounded_search",
    "arguments": {
      "query": "latest AI developments in 2025"
    }
  }
}
```

#### Complex Analysis with High Reasoning Effort
```json
{
  "method": "tools/call",
  "params": {
    "name": "grounded_search",
    "arguments": {
      "query": "comprehensive analysis of quantum computing breakthroughs in 2025",
      "model": "o3-2025-04-16",
      "reasoning_effort": "high"
    }
  }
}
```

#### Quick Response with Lightweight Model
```json
{
  "method": "tools/call",
  "params": {
    "name": "grounded_search",
    "arguments": {
      "query": "current weather in San Francisco",
      "model": "gpt-5-nano",
      "reasoning_effort": "low"
    }
  }
}
```

### Response Format
```
Today's date: 2025-01-25
Query: [your query]
Model: [selected model]
Reasoning Effort: [selected effort level]

[Comprehensive response with current information]

**Sources:**
1. Source Title - https://example.com/article
2. Another Source - https://example.com/research
```

## Token Limits

Token limits are automatically adjusted based on reasoning effort levels:

| Reasoning Effort | Token Limit | Use Case |
|-----------------|-------------|----------|
| **Low** | 4,000 tokens | Quick searches, simple queries |
| **Medium** | 8,000 tokens | Detailed research, comprehensive answers |
| **High** | 16,000 tokens | In-depth analysis, complex topics |

## Deployment

### Production Deployment Considerations

**Security:**
- Secure API key management using environment variables
- Implement rate limiting to prevent abuse
- Use HTTPS for all external communications
- Regular security audits and dependency updates

**Monitoring:**
- Implement comprehensive logging for debugging and monitoring
- Set up error tracking and alerting systems
- Monitor API usage and costs
- Track performance metrics and response times

**Scalability:**
- The server supports horizontal scaling through multiple instances
- Implement load balancing for high-availability deployments
- Consider caching frequently requested information
- Monitor resource usage and optimize as needed

**Environment Setup:**
- Use process managers like PM2 for production deployments
- Configure proper environment variables for different stages
- Implement health checks and automatic restarts
- Set up backup and recovery procedures

### Server Operation

The MCP server operates on-demand:
- Automatically started by MCP clients when needed
- Shuts down when not in use to conserve resources
- No manual server management required
- Supports concurrent requests from multiple clients

## Troubleshooting

### Authentication Issues

**Verify API Key Format:**
```bash
echo $OPENAI_API_KEY | grep "^sk-"
```

**Test API Connectivity:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Model Access Issues

- Ensure your OpenAI account has access to GPT-5 and O3 models
- Check API usage limits and billing status
- Verify model availability in your region
- Contact OpenAI support for access-related issues

### Configuration Problems

**MCP Connection Issues:**
- Verify the absolute path to `index.js` is correct
- Ensure Node.js version is 18 or higher
- Check that environment variables are properly configured
- Restart your MCP client after configuration changes

**Timeout Errors:**
- Increase timeout values for complex queries
- Use appropriate reasoning effort levels
- Monitor network connection stability
- Check server logs for detailed error information

### Debug Mode

```bash
# Run with debug output
OPENAI_API_KEY=your-key node index.js 2>&1 | tee debug.log

# Verify server startup
node index.js
```

### Common Solutions

1. **Path Issues**: Use absolute paths in configuration files
2. **Permission Errors**: Ensure proper file permissions for the project directory
3. **Network Issues**: Check firewall settings and network connectivity
4. **Dependency Issues**: Run `npm install` to ensure all dependencies are installed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Current Version**: 1.2.0  
**Node.js**: 18+  
**MCP Protocol**: 1.0.1  
**Supported Models**: O3-2025-04-16, GPT-5, GPT-5-mini, GPT-5-nano