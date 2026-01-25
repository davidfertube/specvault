# CLAUDE.md - SteelIntel Project Guide

## Project Overview

**SteelIntel** is an AI-powered RAG (Retrieval-Augmented Generation) application for querying steel specifications and oil & gas technical documentation. Built with Next.js 16, FastAPI, LangGraph, and Google Gemini.

**Business Model**: Enterprise SaaS with compliance focus for O&G companies.

## Quick Start

```bash
# 1. Install dependencies
npm install
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start development
npm run dev                                    # Frontend :3000
uvicorn backend.server:app --reload --port 8000  # Backend :8000

# 4. Run tests
npm test && pytest backend/tests/
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js 16    │────▶│   FastAPI        │────▶│  Google Gemini  │
│   (Frontend)    │     │   (Backend)      │     │  (LLM)          │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   Pinecone       │
                        │   (Vector DB)    │
                        └──────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main landing page (Bittensor-inspired design) |
| `components/search-form.tsx` | Search with example queries |
| `components/response-display.tsx` | Response with source citations |
| `lib/api.ts` | API client with types |
| `backend/agent.py` | LangGraph RAG pipeline |
| `backend/server.py` | FastAPI with /api/chat, /health |
| `backend/ingest.py` | PDF ingestion to Pinecone |
| `infra/main.bicep` | Azure infrastructure |

## Commands Reference

```bash
# Development
npm run dev                              # Frontend
uvicorn backend.server:app --reload      # Backend

# Build & Test
npm run build                            # Build Next.js
npm run lint                             # ESLint
npm test                                 # Frontend tests
pytest backend/tests/                    # Backend tests

# Document Ingestion
python backend/ingest.py                 # Ingest PDFs from /data

# Azure Deployment
gh workflow run infra-deploy.yml         # Deploy infrastructure
git push origin main                      # Deploy app (auto)
```

## Environment Variables

```bash
# Required (.env)
GOOGLE_API_KEY=xxx              # Google AI Studio
PINECONE_API_KEY=xxx            # Pinecone
PINECONE_INDEX_NAME=steel-index

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Design System (Bittensor-Inspired)

**Philosophy**: Clean, minimal, white background with black text.

**Colors**:
- Background: `#FFFFFF` (pure white)
- Foreground: `#141414` (near black)
- Muted: `#737373` (gray)
- Yellow: `#D97706` (accent - use sparingly)
- Border: `#EBEBEB` (subtle)

**Typography**:
- Section labels: `uppercase`, `tracking-[0.2em]`, `text-xs`
- Navigation: `uppercase`, `tracking-[0.1em]`
- Headings: `font-semibold`, `tracking-tight`

**Spacing**:
- Section padding: `py-16 sm:py-20 md:py-28 lg:py-32`
- Container max-width: `max-w-5xl`

## MCP Setup (Claude Code Integration)

### Install MCP for Development

Create `.mcp/config.json` in your home directory:

```json
{
  "servers": {
    "steelintelswa": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-filesystem"],
      "env": {
        "ALLOWED_PATHS": "/path/to/knowledge_tool"
      }
    }
  }
}
```

### Available MCP Tools

When using Claude Code with this project:

1. **File Operations**: Read, write, edit project files
2. **Bash**: Run npm, git, pytest commands
3. **Browser**: Test frontend at localhost:3000
4. **GitHub**: Create PRs, manage issues

### Recommended Workflow

```bash
# Start the project
claude "Start SteelIntel development servers"

# Make changes
claude "Update the search form placeholder text"

# Run tests
claude "Run all tests and fix any failures"

# Deploy
claude "Create a PR for the current changes"
```

## API Endpoints

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/api/chat` | `{ query: string }` | `{ response: string, sources: Source[] }` |
| GET | `/health` | - | `{ status: string }` |

### Source Citation Format

```typescript
interface Source {
  ref: string;           // "[1]"
  document: string;      // "ASTM_A106.pdf"
  page: string;          // "5"
  content_preview: string;
}
```

## Testing

### Frontend (Vitest)
```bash
npm test                    # Run once
npm test -- --watch         # Watch mode
npm test -- --coverage      # Coverage report
```

### Backend (pytest)
```bash
pytest backend/tests/           # All tests
pytest backend/tests/ -v        # Verbose
pytest backend/tests/ -k "test_retrieve"  # Specific test
```

### Test Queries for PhD Demo

1. "What is the yield strength of A106 Grade B?"
2. "Does 4140 steel meet NACE MR0175 requirements?"
3. "Compare A53 and A106 for high-temperature service"
4. "Maximum allowable hardness for sour service?"

## Azure Deployment

### Prerequisites
- Azure account with subscription
- GitHub repository access
- API keys (Google AI, Pinecone)

### Quick Deploy

1. **Configure Secrets** (GitHub → Settings → Secrets):
   - `AZURE_CLIENT_ID`
   - `AZURE_TENANT_ID`
   - `AZURE_SUBSCRIPTION_ID`
   - `GOOGLE_API_KEY`
   - `PINECONE_API_KEY`

2. **Deploy Infrastructure**:
   ```bash
   gh workflow run infra-deploy.yml -f environment=dev
   ```

3. **Deploy App** (automatic on push to main):
   ```bash
   git push origin main
   ```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Project Status

### Completed
- [x] Bittensor-inspired UI design
- [x] Source citations with expandable previews
- [x] Mobile-responsive layout
- [x] Azure deployment infrastructure
- [x] CI/CD pipelines
- [x] Unit tests (frontend + backend)

### Pending
- [ ] Add PDF documents to /data
- [ ] Run document ingestion
- [ ] Deploy to Azure (live)
- [ ] PhD demo validation

## Debugging

### Backend Issues
```bash
# Check if running
curl http://localhost:8000/health

# Check API keys
python -c "import os; print(os.getenv('GOOGLE_API_KEY')[:5])"

# Check Pinecone connection
python -c "from pinecone import Pinecone; print(Pinecone().list_indexes())"
```

### Frontend Issues
```bash
# Check API URL
echo $NEXT_PUBLIC_API_URL

# Test API call
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

### Common Fixes
- **CORS errors**: Check backend CORS config in server.py
- **API timeout**: Increase timeout in lib/api.ts
- **Build fails**: Clear `.next/` and rebuild

## Related Documentation

- [TASKS.md](TASKS.md) - Implementation checklist
- [DEPLOYMENT.md](DEPLOYMENT.md) - Azure deployment guide
- [README.md](README.md) - Project overview
