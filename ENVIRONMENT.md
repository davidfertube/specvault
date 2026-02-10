# Environment Configuration

This document describes the environment setup for SpecVault's three-tier deployment (dev/staging/prod).

## Multi-Environment Architecture

```
dev branch      → Vercel Dev Project      → dev.specvault.app       → Supabase Dev
staging branch  → Vercel Staging Project  → staging.specvault.app   → Supabase Staging
main branch     → Vercel Prod Project     → specvault.app           → Supabase Prod
```

## Required Environment Variables

### Development (.env.local)

```bash
# Supabase (Dev)
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_KEY=your-dev-service-key

# Anthropic API (Primary LLM)
ANTHROPIC_API_KEY=sk-ant-...

# Voyage AI (Embeddings + Reranking)
VOYAGE_API_KEY=pa-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Fallback LLMs
GROQ_API_KEY=gsk_...
CEREBRAS_API_KEY=csk_...
SAMBANOVA_API_KEY=...
OPENROUTER_API_KEY=sk-or-...

# Optional: OCR (for scanned PDFs)
GOOGLE_API_KEY=...

# Optional: Observability
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

### Staging (Vercel Environment Variables)

Set these in Vercel Project Settings → Environment Variables → Staging:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_KEY=your-staging-service-key
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...
NEXT_PUBLIC_APP_URL=https://staging.specvault.app
```

### Production (Vercel Environment Variables)

Set these in Vercel Project Settings → Environment Variables → Production:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_KEY=your-prod-service-key
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...
NEXT_PUBLIC_APP_URL=https://specvault.app
```

## GitHub Secrets (for CI/CD)

Add these to GitHub Repository Settings → Secrets and Variables → Actions:

```bash
# Vercel (shared across all environments)
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...          # Production project
VERCEL_PROJECT_ID_DEV=...      # Dev project
VERCEL_PROJECT_ID_STAGING=...  # Staging project

# Supabase - Dev
DEV_SUPABASE_URL=https://your-dev-project.supabase.co
DEV_SUPABASE_ANON_KEY=...
DEV_APP_URL=https://dev.specvault.app

# Supabase - Staging
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=...
STAGING_APP_URL=https://staging.specvault.app

# Supabase - Production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=https://specvault.app

# LLM APIs (shared)
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...
```

## Supabase Project Setup

### 1. Create Three Supabase Projects

1. Go to https://supabase.com/dashboard
2. Create three new projects:
   - `specvault-dev`
   - `specvault-staging`
   - `specvault-prod`
3. Copy the URL and anon key from each project's Settings → API

### 2. Run Database Migrations

For each project, go to SQL Editor and run these migrations in order:

1. `supabase/migrations/001_initial_schema.sql` (if exists, or skip if tables already exist)
2. `supabase/migrations/002_add_feedback_table.sql` (if exists)
3. `supabase/migrations/003_add_user_tables.sql`
4. `supabase/migrations/004_add_subscription_tables.sql`
5. `supabase/migrations/006_update_rls_policies.sql`

**Verification Query:**

```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

Expected: All tables should have `rowsecurity = true`

### 3. Enable Storage Bucket

For each project:

1. Go to Storage
2. Create a new bucket named `documents`
3. Set bucket to **Private** (authenticated access only)
4. Add RLS policy:

```sql
-- Allow authenticated users to upload to their workspace folder
CREATE POLICY "Allow workspace uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their workspace documents
CREATE POLICY "Allow workspace reads" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Vercel Project Setup

### 1. Create Three Vercel Projects

1. Go to https://vercel.com/dashboard
2. Import your GitHub repo three times, naming them:
   - `specvault-dev`
   - `specvault-staging`
   - `specvault` (production)

### 2. Configure Git Branch Settings

For each project, go to Settings → Git:

- **Dev Project**: Deploy from `dev` branch
- **Staging Project**: Deploy from `staging` branch
- **Production Project**: Deploy from `main` branch

### 3. Set Environment Variables

For each project, go to Settings → Environment Variables and add the variables listed above.

**Important:**
- Use separate Supabase projects for each environment
- Never share production credentials with dev/staging
- Set `NEXT_PUBLIC_APP_URL` to match the Vercel deployment URL

## Domain Configuration

### Vercel Custom Domains

1. **Dev**: `dev.specvault.app` → specvault-dev project
2. **Staging**: `staging.specvault.app` → specvault-staging project
3. **Production**: `specvault.app` and `www.specvault.app` → specvault project

Add these in Vercel Project Settings → Domains

### DNS Configuration (for specvault.app)

Add these records in your domain registrar:

```
Type  Name     Value
----  ----     -----
A     @        76.76.21.21  (Vercel)
CNAME www      cname.vercel-dns.com
CNAME dev      cname.vercel-dns.com
CNAME staging  cname.vercel-dns.com
```

## API Keys Setup

### Required APIs

1. **Anthropic** (Primary LLM)
   - Sign up: https://console.anthropic.com
   - Create API key
   - Cost: ~$15-30/month for typical usage
   - Model: Claude Sonnet 4.5

2. **Voyage AI** (Embeddings + Reranking)
   - Sign up: https://www.voyageai.com
   - Create API key
   - Free tier: 200M tokens/month embeddings
   - Reranking: $0.05 per 1000 rerank calls

### Optional APIs

3. **Groq** (Fallback LLM)
   - Sign up: https://console.groq.com
   - Free tier: 6000 TPM

4. **Cerebras** (Fallback LLM)
   - Sign up: https://cerebras.ai

5. **OpenRouter** (Fallback LLM)
   - Sign up: https://openrouter.ai
   - Pay-as-you-go pricing

6. **Google AI Studio** (OCR for scanned PDFs)
   - Sign up: https://ai.google.dev
   - Free tier available

## Migration Checklist

When promoting changes through environments:

### Dev → Staging

1. Create PR from `dev` to `staging`
2. Wait for CI checks to pass (lint, unit tests, build)
3. Merge PR (triggers staging deployment)
4. Verify staging deployment at https://staging.specvault.app
5. Run manual smoke tests

### Staging → Production

1. Create PR from `staging` to `main`
2. Wait for CI checks + accuracy tests (90%+ threshold)
3. Get approval from team lead
4. Merge PR (triggers production deployment)
5. Monitor production for 24h
6. Check error rates in Vercel logs

## Rollback Procedure

If production deployment fails:

1. Go to Vercel dashboard → Deployments
2. Find last known good deployment
3. Click "..." → "Promote to Production"
4. Or revert the Git commit and push to main

## Security Checklist

- [ ] All Supabase projects have RLS enabled
- [ ] Service role keys are NOT exposed in frontend code
- [ ] API keys are stored as Vercel secrets, not in code
- [ ] `NEXT_PUBLIC_*` variables contain no sensitive data
- [ ] Supabase storage buckets are set to private
- [ ] CORS is configured correctly in Supabase
- [ ] Rate limiting is enabled in middleware.ts

## Monitoring

### Vercel Analytics

- Go to Vercel Project → Analytics
- Monitor:
  - Request count
  - Error rate (should be <1%)
  - P95 latency (should be <30s for /api/chat)

### Supabase Monitoring

- Go to Supabase Project → Reports
- Monitor:
  - Database size (free tier: 500MB)
  - API requests
  - Storage usage

### Cost Tracking

Expected monthly costs:

| Service | Dev | Staging | Prod | Total |
|---------|-----|---------|------|-------|
| Supabase | $0 | $0 | $25 | $25 |
| Vercel | $0 | $0 | $20 | $20 |
| Anthropic | $10 | $10 | $500+ | $520+ |
| Voyage AI | $0 | $0 | $0-50 | $0-50 |
| **Total** | **$10** | **$10** | **$545-595** | **$565-605** |

## Troubleshooting

### "Unauthorized" errors

- Check `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- Verify user is signed in
- Check RLS policies in Supabase SQL Editor

### "Quota Exceeded" errors

- Check `usage_quotas` table in Supabase
- Verify `period_end` hasn't passed (should auto-reset)
- Manually reset quota if needed:

```sql
UPDATE usage_quotas
SET queries_used = 0, documents_used = 0, api_calls_used = 0,
    period_start = NOW(), period_end = NOW() + INTERVAL '1 month'
WHERE workspace_id = 'your-workspace-id';
```

### Deployment failing on build

- Check all environment variables are set in Vercel
- Verify database migrations have run
- Check Vercel build logs for specific errors

## Support

- GitHub Issues: https://github.com/davidfertube/specvault/issues
- Email: [Your support email]
