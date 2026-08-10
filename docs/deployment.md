# Deployment Guide

This document describes how to deploy `frasberg` to Supabase.

## Prerequisites

You need two GitHub Actions secrets configured in the repository before running a deployment:

| Secret | Description |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Personal access token from [app.supabase.com/account/tokens](https://app.supabase.com/account/tokens) |
| `SUPABASE_PROJECT_REF` | Project reference ID found in **Project Settings → General** in the Supabase dashboard |

> **Never** commit these values to source control. Add them via **GitHub → Settings → Secrets and variables → Actions**.

## What Gets Deployed

| Component | Source path | Supabase command |
|---|---|---|
| Database migrations | `supabase/migrations/*.sql` | `supabase db push` |
| Edge functions | `supabase/functions/**` | `supabase functions deploy --no-verify-jwt` |

## How to Trigger a Manual Deploy

1. Open the repository on GitHub.
2. Navigate to **Actions → Deploy to Supabase**.
3. Click **Run workflow**.
4. (Optional) Toggle the **Deploy database migrations** and/or **Deploy edge functions** inputs to control which components are deployed.
5. Click the green **Run workflow** button.

The workflow will fail immediately and log a clear error if either required secret is missing.

## Workflow File

The workflow is defined in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

It runs on **`workflow_dispatch` only** (manual trigger) so deployments are always intentional and reviewable. No automatic push-triggered deployments are performed.

## Security Notes

- The workflow uses `permissions: contents: read` (least-privilege).
- Secrets are never echoed to logs.
- The Supabase CLI is authenticated via the `SUPABASE_ACCESS_TOKEN` secret and the session is scoped to the linked project only.
