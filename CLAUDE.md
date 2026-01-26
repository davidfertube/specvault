# CLAUDE.md - Steel Knowledge Tool

## MVP Status (2026-01-26)

| Component | Status | URL |
|-----------|--------|-----|
| **Frontend** | LIVE | https://red-flower-0152ee60f.1.azurestaticapps.net |
| **Backend** | Pending Azure Function App creation | https://steel-agent-api.azurewebsites.net |
| **CI/CD** | All tests pass | GitHub Actions |
| **Demo Mode** | Working | Canned responses for testing |

### What's Working
- Frontend deployed to Azure Static Web Apps
- Demo mode with realistic steel specification responses
- CI/CD pipeline (frontend + backend tests pass)
- MCP automation tools configured

### What's Needed for Launch
1. Create Azure Function App via Portal (Name: `steel-agent-api`)
2. Add publish profile to GitHub secrets (`AZURE_FUNCTIONAPP_PUBLISH_PROFILE`)
3. Configure CORS on Function App
4. Upload steel specification PDFs to `/data/`
5. Create Pinecone index and run document ingestion

---

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

---

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
| `app/page.tsx` | Main landing page |
| `components/search-form.tsx` | Search with example queries |
| `components/response-display.tsx` | Response with source citations |
| `lib/api.ts` | API client with demo fallback |
| `backend/agent.py` | LangGraph RAG pipeline |
| `backend/server.py` | FastAPI with /api/chat, /health |
| `backend/mcp_server.py` | MCP tools for automation |
| `backend/ingest.py` | PDF ingestion to Pinecone |
| `.mcp.json` | MCP server configuration |

---

## MCP Automation

### What is MCP?
Model Context Protocol (MCP) enables Claude to interact with external tools and automate workflows. This project provides steel knowledge tools via MCP.

### Available MCP Tools

| Tool | Description | Example |
|------|-------------|---------|
| `query_steel_specs` | Search steel specifications | "What is yield strength of A106?" |
| `check_compliance` | Verify material compliance | "Does 4140 meet NACE MR0175?" |
| `compare_materials` | Compare steel grades | "Compare A53 and A106" |
| `list_documents` | Show indexed documents | Lists all PDFs in knowledge base |
| `get_health` | Check backend status | Returns health and mode info |

### MCP Configuration

The `.mcp.json` file configures the MCP servers:

```json
{
  "mcpServers": {
    "steel-knowledge": {
      "command": "python",
      "args": ["-m", "backend.mcp_server"],
      "env": {
        "GOOGLE_API_KEY": "${GOOGLE_API_KEY}",
        "PINECONE_API_KEY": "${PINECONE_API_KEY}",
        "PINECONE_INDEX_NAME": "steel-index"
      }
    }
  }
}
```

### Using MCP Tools

```bash
# Run MCP server locally
python -m backend.mcp_server

# In Claude Code
claude "Use query_steel_specs to find yield strength of A106 Grade B"
claude "Use check_compliance to verify 4140 meets NACE MR0175 for sour service"
claude "Use compare_materials to compare A53 and A106"
```

---

## Workflow Automation

### Available Workflows

1. **Document Processing**
   - Trigger: New PDF uploaded to `/data/`
   - Action: Ingest → Embed → Index → Notify

2. **Compliance Checking**
   - Trigger: API request or Claude query
   - Action: Search specs → Verify requirements → Generate report

3. **Batch Queries**
   - Trigger: CSV of materials
   - Action: Check each → Generate compliance matrix

---

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

# MCP Server
python -m backend.mcp_server             # Run MCP server locally

# Azure Deployment
git push origin main                     # Auto-deploys via CI/CD
```

---

## Environment Variables

```bash
# Required for production (.env)
GOOGLE_API_KEY=xxx              # Google AI Studio
PINECONE_API_KEY=xxx            # Pinecone Console
PINECONE_INDEX_NAME=steel-index

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Endpoints

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/api/chat` | `{ query: string }` | `{ response: string, sources: Source[] }` |
| GET | `/health` | - | `{ status: string, version: string, mode: string }` |

### Source Citation Format

```typescript
interface Source {
  ref: string;           // "[1]"
  document: string;      // "ASTM_A106.pdf"
  page: string;          // "5"
  content_preview: string;
}
```

---

## MVP Launch Checklist

### Infrastructure (Manual Steps Required)
- [ ] Create Azure Function App via Portal
  - Name: `steel-agent-api`
  - Runtime: Python 3.11
  - Plan: Consumption (Serverless)
- [ ] Add environment variables to Function App:
  - `GOOGLE_API_KEY`
  - `PINECONE_API_KEY`
  - `PINECONE_INDEX_NAME=steel-index`
- [ ] Download publish profile → Add to GitHub secrets as `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
- [ ] Configure CORS:
  - `https://red-flower-0152ee60f.1.azurestaticapps.net`
  - `http://localhost:3000`

### Data
- [ ] Gather steel specification PDFs (ASTM, NACE, API)
- [ ] Create Pinecone index (`steel-index`, 768 dims, cosine)
- [ ] Run `python backend/ingest.py`

### Verification
```bash
curl https://steel-agent-api.azurewebsites.net/health
# Expected: {"status":"ok","version":"1.0.0","mode":"production"}
```

---

## Coworker Onboarding

### Project Overview
Steel Knowledge Tool is an AI-powered RAG system for querying steel specifications and O&G compliance documents.

**Tech Stack:**
- Frontend: Next.js 16, TypeScript, Tailwind CSS
- Backend: FastAPI, LangGraph, Google Gemini
- Vector DB: Pinecone
- Deployment: Azure (Static Web Apps + Functions)
- Automation: MCP (Model Context Protocol)

### First Steps
1. Clone: `git clone https://github.com/davidfertube/steel-venture`
2. Install: `npm install && pip install -r requirements.txt`
3. Configure: Copy `.env.example` to `.env`, add API keys
4. Run: `npm run dev` + `uvicorn backend.server:app --reload`

### Questions for Discussion
1. Do we have steel specification PDFs? (ASTM, NACE, API)
2. Who has Azure portal access?
3. Should we add user authentication for MVP?
4. What compliance checks are priority? (NACE MR0175, hardness limits?)
5. Do we need a custom domain?

---

## Testing

### Frontend (Vitest)
```bash
npm test                    # Run once
npm test -- --watch         # Watch mode
```

### Backend (pytest)
```bash
pytest backend/tests/           # All tests
pytest backend/tests/ -v        # Verbose
```

### Test Queries

1. "What is the yield strength of A106 Grade B?"
2. "Does 4140 steel meet NACE MR0175 requirements?"
3. "Compare A53 and A106 for high-temperature service"
4. "Maximum allowable hardness for sour service?"

---

## Design System

**Colors**:
- Background: `#FFFFFF` (white)
- Foreground: `#141414` (near black)
- Muted: `#737373` (gray)
- Yellow: `#D97706` (accent - use sparingly)

**Typography**:
- Section labels: `uppercase`, `tracking-[0.2em]`, `text-xs`
- Headings: `font-semibold`, `tracking-tight`

---

## Troubleshooting

### Backend Issues
```bash
curl http://localhost:8000/health
```

### Frontend Issues
```bash
echo $NEXT_PUBLIC_API_URL
```

### Common Fixes
- **CORS errors**: Check Function App CORS settings
- **API timeout**: Increase timeout in lib/api.ts
- **Demo mode active**: Verify API keys are set

---

## Business Context

### Value Proposition
- Engineers spend 2-4 hours/day searching specs manually
- Wrong material spec = potential $10M+ liability
- Steel Knowledge Tool provides traceable, citable answers

### Target Market
- Tier 1: Major O&G (Shell, Chevron, ExxonMobil)
- Tier 2: EPC Contractors (Fluor, Bechtel, KBR)
- Tier 3: Engineering consultancies, inspection firms

### Key Differentiator
> "Not another AI chatbot - it's a compliance verification engine with traceable citations that engineers can cite in their reports."

---

## Related Documentation

- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Technical implementation guide
- [README.md](README.md) - Project overview
