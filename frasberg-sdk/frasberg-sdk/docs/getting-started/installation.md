# Installation

## Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher (or equivalent package manager)
- TypeScript 5.0+ (for TypeScript projects)

## Installing from GitHub Packages

The Frasberg SDK is published to GitHub Packages:

```bash
npm install @frasberg/core-sdk
```

### Authentication for GitHub Packages

Create or update your `.npmrc` file:

```
@frasberg:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Set your GitHub personal access token:

```bash
export GITHUB_TOKEN=your_github_token_here
```

## Installing from Source

Clone the repository and build locally:

```bash
git clone https://github.com/emeraldorbit/frasberg-backend.git
cd frasberg-backend/frasberg-sdk
npm install
npm run build
```

## Verifying Installation

Create a test file to verify the SDK is working:

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();
console.log('Frasberg SDK loaded successfully!');
```

## Next Steps

- [Configuration](configuration.md) - Set up your environment variables
- [Quickstart Guide](quickstart.md) - Start generating content
- [Environment Setup](environment-setup.md) - Complete development setup
