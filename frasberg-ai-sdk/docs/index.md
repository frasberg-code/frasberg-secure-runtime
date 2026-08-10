# Frasberg AI SDK Documentation

Welcome to the official documentation for the Frasberg AI SDK.

## Overview

Frasberg AI SDK is a unified client for text, image, and video generation powered exclusively by the Frasberg AI API. This SDK enforces a strict, sovereign provider architecture with no external dependencies or fallback mechanisms.

## Key Features

- **Unified Provider Model** - Single API for all generation capabilities
- **Type-Safe** - Full TypeScript support with strict typing
- **Secure by Default** - No external providers, no fallback mechanisms
- **Zero Dependencies** - Minimal runtime footprint
- **Well Documented** - Comprehensive guides and API references

## Quick Links

- [Installation](getting-started/installation.md)
- [Configuration](getting-started/configuration.md)
- [Quickstart Guide](getting-started/quickstart.md)
- [API Reference](api/client.md)
- [Architecture Overview](architecture/overview.md)

## Provider Policy

All AI, LLM, image, and video operations use **Frasberg AI API exclusively**:
- No OpenAI, Anthropic, Gemini, Stability AI, or Emergent LLM
- No fallback providers
- API keys from GitHub Secrets or Supabase Vault only
- All external providers disabled by default

## Support

- [Troubleshooting Guide](guides/troubleshooting.md)
- [GitHub Issues](https://github.com/FrasbergAI/frasberg/issues)
- [Security Policy](governance/security.md)
