# IMPLEMENTATION.md - Technical Implementation Guide

## Overview

This document provides technical details for implementing and extending the Steel Knowledge Tool.

---

## System Components

### 1. Frontend (Next.js 16)

**Location**: Root directory

**Key Technologies**:
- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Vitest for testing

**Entry Points**:
- `app/page.tsx` - Main landing page
- `app/layout.tsx` - Root layout with providers

**API Integration** (`lib/api.ts`):
```typescript
// Queries the backend with automatic demo fallback
export async function queryKnowledgeBase(query: string): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) throw new ApiRequestError(...);
    return response.json();
  } catch (error) {
    // Falls back to demo mode if backend unavailable
    return getDemoResponse(query);
  }
}
```

### 2. Backend (FastAPI + LangGraph)

**Location**: `backend/`

**Key Files**:
| File | Purpose |
|------|---------|
| `server.py` | FastAPI app with endpoints |
| `agent.py` | LangGraph RAG pipeline |
| `ingest.py` | PDF ingestion to Pinecone |
| `mcp_server.py` | MCP tools for automation |
| `function_app.py` | Azure Functions wrapper |

**Demo Mode**:
The backend automatically detects if API keys are missing and runs in demo mode:
```python
DEMO_MODE = not os.getenv("GOOGLE_API_KEY") or not os.getenv("PINECONE_API_KEY")
```

### 3. Vector Database (Pinecone)

**Configuration**:
- Index Name: `steel-index`
- Dimensions: 768 (Google embeddings)
- Metric: cosine
- Pod Type: Starter (free tier)

**Document Structure**:
```python
{
    "id": "doc_123_chunk_0",
    "values": [0.1, 0.2, ...],  # 768-dim embedding
    "metadata": {
        "source": "ASTM_A106.pdf",
        "page": 5,
        "content_preview": "Yield strength requirements...",
        "chunk_index": 0
    }
}
```

### 4. MCP Server

**Location**: `backend/mcp_server.py`

**Tools Provided**:

```python
@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(name="query_steel_specs", ...),
        Tool(name="check_compliance", ...),
        Tool(name="compare_materials", ...),
        Tool(name="list_documents", ...),
        Tool(name="get_health", ...),
    ]
```

**Running the MCP Server**:
```bash
python -m backend.mcp_server
```

---

## Data Flow

### Query Flow

```
User Query
    │
    ▼
Frontend (Next.js)
    │
    ├──▶ POST /api/chat
    │         │
    │         ▼
    │    Backend (FastAPI)
    │         │
    │         ├──▶ [Demo Mode] → Return canned response
    │         │
    │         └──▶ [Production Mode]
    │                   │
    │                   ▼
    │              LangGraph Agent
    │                   │
    │                   ├──▶ Retrieve (Pinecone)
    │                   │         │
    │                   │         ▼
    │                   │    Similarity Search
    │                   │         │
    │                   ▼         │
    │              Generate (Gemini) ◀──┘
    │                   │
    │                   ▼
    │              Response + Sources
    │
    ▼
Display Response with Citations
```

### Ingestion Flow

```
PDF Files (/data/*.pdf)
    │
    ▼
Ingest Script (ingest.py)
    │
    ├──▶ PyPDF2: Extract text
    │
    ├──▶ LangChain: Chunk text
    │         │
    │         ▼
    │    ~500 token chunks
    │    with overlap
    │
    ├──▶ Google Embeddings: Embed chunks
    │         │
    │         ▼
    │    768-dim vectors
    │
    └──▶ Pinecone: Store vectors + metadata
```

---

## Configuration

### Environment Variables

```bash
# Backend (.env)
GOOGLE_API_KEY=xxx          # Required for LLM and embeddings
PINECONE_API_KEY=xxx        # Required for vector storage
PINECONE_INDEX_NAME=steel-index

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Azure Configuration

**Static Web App** (Frontend):
- Build: `npm run build`
- Output: `out/` (static export)
- Node: 20

**Function App** (Backend):
- Runtime: Python 3.11
- Entry: `function_app.py`
- CORS: Must allow frontend origin

---

## Extending the System

### Adding New MCP Tools

1. Add tool definition in `mcp_server.py`:
```python
Tool(
    name="new_tool_name",
    description="What the tool does",
    inputSchema={
        "type": "object",
        "properties": {
            "param1": {"type": "string", "description": "..."}
        },
        "required": ["param1"]
    }
)
```

2. Implement handler:
```python
@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "new_tool_name":
        # Implementation
        return [TextContent(type="text", text=result)]
```

### Adding New Document Types

1. Place documents in `/data/`
2. Update `ingest.py` if needed for special parsing
3. Run ingestion: `python backend/ingest.py`

### Customizing RAG Pipeline

Edit `backend/agent.py`:

```python
# Adjust retrieval count
docs = vectorstore.similarity_search(query, k=10)  # Default: 5

# Modify system prompt
SYSTEM_PROMPT = """You are an expert in steel specifications...
Always cite sources using [1], [2], etc.
..."""

# Add filtering
docs = vectorstore.similarity_search(
    query,
    k=10,
    filter={"document_type": "astm_standard"}
)
```

---

## Testing

### Unit Tests

**Frontend**:
```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

**Backend**:
```bash
pytest backend/tests/     # Run all tests
pytest backend/tests/ -v  # Verbose
```

### Integration Testing

```bash
# Start backend
uvicorn backend.server:app --reload --port 8000

# Test health
curl http://localhost:8000/health

# Test query
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the yield strength of A106 Grade B?"}'
```

### MCP Testing

```bash
# Run MCP server
python -m backend.mcp_server

# Test with Claude Code
claude "Use get_health to check the steel knowledge backend"
```

---

## Deployment

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/azure-deploy.yml`) handles:

1. **Build Frontend**: `npm ci && npm run build`
2. **Test Frontend**: `npm test -- --run`
3. **Build Backend**: `pip install && pytest`
4. **Deploy Frontend**: Azure Static Web Apps
5. **Deploy Backend**: Azure Functions (requires publish profile)

### Manual Deployment Steps

1. **Create Azure Function App**:
   - Go to Azure Portal
   - Create Function App (Python 3.11, Consumption plan)
   - Add environment variables

2. **Get Publish Profile**:
   - Azure Portal → Function App → Get publish profile
   - Add to GitHub secrets as `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

3. **Configure CORS**:
   - Azure Portal → Function App → API → CORS
   - Add frontend URL

4. **Trigger Deployment**:
   ```bash
   git push origin main
   ```

---

## Troubleshooting

### Backend Won't Start

**Issue**: `ModuleNotFoundError: No module named 'agent'`

**Fix**: Ensure `sys.path` includes backend directory:
```python
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
```

### Pinecone Connection Fails

**Issue**: `TypeError: Pinecone.__init__() got an unexpected keyword argument`

**Fix**: Update to latest `langchain-pinecone`:
```bash
pip install --upgrade langchain-pinecone
```

### CORS Errors

**Issue**: Frontend can't reach backend

**Fix**:
- Local: Check `allow_origins=["*"]` in `server.py`
- Azure: Add frontend URL to Function App CORS settings

### Demo Mode Active in Production

**Issue**: Backend returns demo responses even with API keys

**Fix**: Verify environment variables are set in Azure:
- `GOOGLE_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`

---

## Performance Optimization

### Retrieval

- Increase `k` for more comprehensive results: `k=10`
- Add metadata filtering for targeted search
- Use hybrid search (semantic + keyword) for better accuracy

### Response Generation

- Adjust `max_tokens` based on query complexity
- Use streaming for long responses
- Cache frequent queries

### Ingestion

- Batch process PDFs: `batch_size=10`
- Optimize chunk size: `~500 tokens`
- Add overlap for context: `~50 tokens`

---

## Security Considerations

### API Keys

- Never commit API keys to git
- Use environment variables or secrets management
- Rotate keys periodically

### CORS

- In production, specify exact allowed origins
- Don't use `allow_origins=["*"]` in production

### Input Validation

- Validate query length and content
- Sanitize user input before processing
- Rate limit API endpoints

---

## Monitoring

### Health Checks

```bash
# Backend health
curl https://steel-agent-api.azurewebsites.net/health

# Expected response
{"status":"ok","version":"1.0.0","mode":"production"}
```

### Logs

- Azure Portal → Function App → Monitor → Logs
- Application Insights for detailed telemetry

### Metrics to Track

- Query response time
- Error rate
- Retrieval relevance scores
- Token usage
