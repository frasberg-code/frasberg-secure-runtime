# FrasbergAI Contributor Visibility Policy

## Allowed contributor types

- Human contributors with verified identities
- FrasbergAI engineering team members
- Approved external collaborators

## Forbidden contributor types

- Copilot
- GitHub Actions bot
- Dependabot
- Any automated agent

## Commit author requirements

- All commits must be authored by a human
- All commits must be signed
- Automated commits must be rewritten before merging
- Policy-as-Code workflow enforces author validation

## Contributor list governance

- Automated authors are removed via history rewrite
- Rulesets prevent automated authors from pushing
- CI blocks pull requests containing automated commits
