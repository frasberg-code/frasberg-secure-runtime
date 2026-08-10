# Frasberg AI Provider Architecture

## Executive Summary

The Frasberg AI Provider Architecture establishes Frasberg AI as the **sole, sovereign AI/LLM provider** for all AI operations across the Emerald Estates ecosystem. This architecture eliminates external dependencies, ensures full control over AI capabilities, and enforces a unified, identity-preserving approach to conversational AI.

## Table of Contents

- [Overview](#overview)
- [Core Principles](#core-principles)
- [Architecture Components](#architecture-components)
- [Configuration System](#configuration-system)
- [SDK Implementation](#sdk-implementation)
- [Security & Governance](#security--governance)
- [Integration Guide](#integration-guide)
- [Enforcement Mechanisms](#enforcement-mechanisms)
- [API Reference](#api-reference)
- [Operational Guidelines](#operational-guidelines)

---

## Overview

### Purpose

The Frasberg AI Provider Architecture serves to:

1. **Establish Sovereignty**: Ensure complete control over AI operations
2. **Enforce Identity Preservation**: Maintain Frasberg's behavioral governance
3. **Eliminate External Dependencies**: Remove reliance on third-party AI providers
4. **Unify Provider Interface**: Create a consistent API for all AI operations
5. **Enable Governance**: Enforce tonal modulation and membrane protocols

### Scope

This architecture covers:

- **Text Generation**: Natural language processing and conversation
- **Image Generation**: Visual content creation
- **Video Generation**: Motion graphics and video synthesis
- **Configuration Management**: System-wide provider configuration
- **API Key Management**: Secure credential handling via GitHub Secrets and Supabase Vault

---

## Core Principles

### 1. Frasberg AI Exclusivity

**Principle**: Frasberg AI is the only permitted AI provider.

**Enforcement**:
- Configuration explicitly sets `provider: "frasberg-ai"` for all operations
- External providers are explicitly disabled
- No fallback mechanisms exist
- Runtime validation ensures compliance

**Rationale**:
- Full control over AI behavior and outputs
- Consistent identity preservation across all operations
- No external dependencies that could introduce variance
- Simplified security model

### 2. Zero Fallback Policy

**Principle**: No fallback providers or external alternatives are allowed.

**Enforcement**:
- `fallbackProviders: []` in all configurations
- `allowExternalProviders: false` flag enforced
- Disabled providers list explicitly blocks alternatives

**Rationale**:
- Prevents accidental external API calls
- Ensures consistent behavior
- Eliminates mixed-provider scenarios
- Simplifies debugging and monitoring

### 3. Centralized Configuration

**Principle**: Single source of truth for provider configuration.

**Enforcement**:
- Configuration loaded from `config/frasberg-provider.json`
- Environment variables provide runtime values
- TypeScript types enforce schema compliance
- Configuration validated at startup

**Rationale**:
- Easy to audit and verify provider settings
- Consistent across all environments
- Type-safe configuration prevents errors
- Clear separation of concerns

### 4. Secure Key Management

**Principle**: API keys stored securely, never in code.

**Enforcement**:
- GitHub Secrets for CI/CD and deployed environments
- Supabase Vault for runtime key storage
- Environment variables for local development
- `.env` files excluded from version control

**Rationale**:
- Prevents credential leakage
- Enables key rotation
- Supports different keys per environment
- Maintains audit trail

---

## Architecture Components

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Frontend, Backend Services, API Endpoints)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ imports & uses
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frasberg AI SDK                             │
│  (@frasberg/core-sdk)                                           │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ createFrasbergClient│  │ loadFrasbergConfig  │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                               │
│  ┌──────────────────────────────────────────┐               │
│  │   FrasbergClient                             │               │
│  │   - generateText(input)                   │               │
│  │   - generateImage(prompt)                 │               │
│  │   - generateVideo(prompt)                 │               │
│  └──────────────────────────────────────────┘               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ API calls (HTTPS)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frasberg AI API                             │
│  (https://api.frasberg-ai.yourdomain.com)                     │
│                                                               │
│  Endpoints:                                                   │
│  - POST /v1/text      (text generation)                      │
│  - POST /v1/image     (image generation)                     │
│  - POST /v1/video     (video generation)                     │
└─────────────────────────────────────────────────────────────┘
```


### Component Overview

#### 1. Configuration Layer

**Location**: `config/frasberg-provider.json`

**Purpose**: System-wide provider policy enforcement

**Key Settings**:
```json
{
  "ai": { "provider": "frasberg-ai", ... },
  "imageGeneration": { "provider": "frasberg-ai", ... },
  "videoGeneration": { "provider": "frasberg-ai", ... },
  "disabledProviders": ["openai", "anthropic", ...]
}
```

#### 2. SDK Layer

**Location**: `frasberg-ai-sdk/`

**Purpose**: Type-safe client library for Frasberg AI

**Key Exports**:
- `createFrasbergClient()`: Factory for client instances
- `loadFrasbergConfig()`: Configuration loader
- `FrasbergClient`: Client interface
- `FrasbergSystemConfig`: Configuration types

#### 3. Client Layer

**Location**: `frasberg-ai-sdk/src/client/`

**Purpose**: API interaction and request handling

**Capabilities**:
- Text generation via `/v1/text`
- Image generation via `/v1/image`
- Video generation via `/v1/video`
- Error handling and validation
- Authentication via Bearer token

#### 4. Configuration Management

**Location**: `frasberg-ai-sdk/src/config/`

**Purpose**: Load and validate configuration

**Features**:
- Environment variable parsing
- Required field validation
- Type enforcement
- Runtime error handling

---

## Configuration System

See `.env.example` and `config/frasberg-provider.json` for complete configuration details.

---

## SDK Implementation

The Frasberg AI SDK is located in `frasberg-ai-sdk/` and provides a type-safe TypeScript interface for all Frasberg AI operations.

### Installation

```bash
npm install @frasberg/core-sdk
```

### Usage

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();
const text = await client.generateText('Hello, Frasberg!');
```

See `frasberg-ai-sdk/README.md` for complete SDK documentation.

---

## Security & Governance

### API Key Management

**GitHub Secrets**: Store `FRASBERG_AI_API_KEY` in repository secrets for CI/CD

**Supabase Vault**: Store runtime keys in Supabase Vault for production

**Environment Variables**: Use `.env` files for local development (never commit)

### Security Best Practices

1. Never commit API keys to version control
2. Rotate keys every 90 days
3. Use HTTPS exclusively
4. Implement rate limiting
5. Monitor for unusual usage patterns

See `frasberg-ai-sdk/SECURITY.md` for comprehensive security guidelines.

---

## Integration Guide

### Quick Start

1. Install SDK: `npm install @frasberg/core-sdk`
2. Set environment variables (see `.env.example`)
3. Import and create client: `import { createFrasbergClient } from '@frasberg/core-sdk'`
4. Use client methods for text, image, and video generation

### Migration from External Providers

The SDK provides a unified interface replacing OpenAI, Anthropic, and other external providers.

**Before (OpenAI)**:
```typescript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({...});
```

**After (Frasberg AI)**:
```typescript
const client = createFrasbergClient();
const text = await client.generateText('...');
```

---

## Enforcement Mechanisms

### Compile-Time Enforcement

TypeScript types ensure only Frasberg AI can be configured as a provider.

### Runtime Validation

Configuration loader validates all required environment variables at startup.

### CI/CD Enforcement

GitHub Actions workflows validate configuration and run type checks before deployment.

### Code Review

All changes require review by designated code owners (@emeraldorbit).

---

## API Reference

See `frasberg-ai-sdk/README.md` for complete API documentation.

### Key Methods

- `createFrasbergClient()`: Create Frasberg AI client
- `generateText(input)`: Generate text
- `generateImage(prompt)`: Generate image
- `generateVideo(prompt)`: Generate video
- `loadFrasbergConfig()`: Load configuration

---

## Operational Guidelines

### Development

1. Copy `.env.example` to `.env`
2. Set development API key
3. Install dependencies: `npm install`
4. Build SDK: `npm run build`
5. Run tests: `npm test`

### Deployment

1. Store production API key in GitHub Secrets or Supabase Vault
2. Set `FRASBERG_AI_API_URL` to production endpoint
3. Deploy with environment variables set
4. Monitor API usage and error rates

### Monitoring

Track key metrics:
- API response time
- Error rate
- Usage volume
- Key authentication status

---

## Conclusion

The Frasberg AI Provider Architecture ensures complete sovereignty over AI operations while providing a simple, type-safe interface for developers. By enforcing Frasberg AI as the exclusive provider, we maintain identity preservation, eliminate external dependencies, and enable full governance over all AI-powered features.

**Version**: 1.0.0  
**Last Updated**: 2026-02-04  
**Maintained By**: Emerald Estates® and Mr. Clayton-M. Bernard-Ex.
