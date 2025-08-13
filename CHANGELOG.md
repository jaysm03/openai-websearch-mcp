# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-08-23

### Added
- Deep Research API support with advanced research capabilities
- New model support: `o3-deep-research` for advanced research queries
- New model support: `o4-mini-deep-research` for efficient deep research
- Enhanced documentation with Deep Research usage examples
- Updated package description to reflect Deep Research capabilities

### Changed
- Updated model selection parameter to include Deep Research models
- Enhanced README with comprehensive Deep Research examples
- Updated supported models list in documentation

### Technical Details
- Maintains full backward compatibility with existing implementations
- No breaking changes to existing API or configuration
- Deep Research models integrate seamlessly with existing reasoning effort levels
- All existing features and models remain fully functional

## [1.2.0] - 2025-08-13

### Added
- OpenAI Multi-Model MCP Server with Web Search Grounding
- Support for multiple OpenAI models: O3-2025-04-16, GPT-5, GPT-5-mini, GPT-5-nano
- Real-time web search integration with grounding capabilities
- Dynamic token management based on reasoning effort levels (4k/8k/16k tokens)
- Configurable reasoning effort: low, medium, high
- Robust timeout handling and error recovery mechanisms
- Source attribution with automatic citation of web sources
- Production-ready deployment with comprehensive error handling
- MCP (Model Context Protocol) 1.0.1 compatibility
- Environment variable configuration for secure API key management
- Support for Roo/Cline and Claude Desktop MCP clients

### Features
- `grounded_search` tool for current information retrieval
- Automatic model selection with intelligent defaults
- Performance optimizations for enterprise deployment
- Comprehensive documentation and troubleshooting guides
- MIT License for open source distribution

### Technical Details
- Node.js 18+ requirement
- ES modules support
- Minimal dependencies for security and performance
- Horizontal scaling support
- Health checks and monitoring capabilities

## [1.0.0] - Initial Development
- Initial project setup and core functionality development