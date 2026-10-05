# Frasberg GitHub/Platform Spec (user-provided, June 2026)
Key items user specced (build on request):
- GitHub App private key flow: env FRASBERG_GITHUB_APP_PRIVATE_KEY / APP_ID, RS256 JWT → installation tokens
- Webhook secret: GITHUB_WEBHOOK_SECRET (endpoint /api/github/webhook BUILT with HMAC verify)
- Agent file spec: agent.json / luchii.yaml {id, name, model, entrypoint, capabilities, env, tools}
- Scaffolding templates: basic/realtime/full agent
- CI/CD workflows: build.yml, sync.yml (POST /api/github/agent-sync), deploy.yml
- Agent Runtime SDK: createAgent, memory API, tools API, realtime.stream
- CLI: fras create|deploy|sync|regions
- Multi-region: us-west, us-east, eu-central, ap-south; secrets replication; failover
- Installation→tenant mapping schema (GitHubInstallation, GitHubRepo)
- Security checklist, developer handbook, whitepaper content (docs material)
