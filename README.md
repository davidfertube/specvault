# SteelIntel

AI-powered RAG application for querying steel specifications and oil & gas documentation.

![SteelIntel Demo](docs/demo-placeholder.png)

## Features

- **Semantic Search** - Query technical documents using natural language
- **AI-Powered Q&A** - Get instant answers from ASTM standards, material properties, and compliance docs
- **LangGraph Pipeline** - Reliable retrieval-augmented generation with Google Gemini
- **Modern UI** - Clean, responsive design with dark mode

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | FastAPI, LangChain, LangGraph |
| AI | Google Gemini Pro, Google Embeddings |
| Vector DB | Pinecone |
| Deployment | Azure Static Web Apps, Azure Functions |

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- [Google AI API key](https://makersuite.google.com/app/apikey) (free)
- [Pinecone account](https://app.pinecone.io/) (free tier)

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/davidfertube/knowledge_tool.git
   cd knowledge_tool
   npm install
   pip install -r requirements.txt
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Add documents to `/data/` directory**
   - Place PDF files with steel specifications
   - Or use the sample data provided

4. **Ingest documents**
   ```bash
   python backend/ingest.py
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Backend
   uvicorn backend.server:app --reload --port 8000

   # Terminal 2: Frontend
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Architecture

```
                    +------------------+
                    |    Frontend      |
                    |   (Next.js 16)   |
                    +--------+---------+
                             |
                             v
                    +--------+---------+
                    |    Backend       |
                    |   (FastAPI)      |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
    +---------+----------+       +----------+---------+
    |   Google Gemini    |       |     Pinecone       |
    |   (LLM + Embed)    |       |   (Vector Store)   |
    +--------------------+       +--------------------+
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Query the knowledge base |
| GET | `/health` | Health check |

### Example Request

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the yield strength of A106 Grade B?"}'
```

## Project Structure

```
steelintelswa/
├── app/                    # Next.js pages
├── components/             # React components
├── lib/                    # Utilities
├── backend/
│   ├── server.py          # FastAPI app
│   ├── agent.py           # LangGraph RAG
│   └── ingest.py          # Document ingestion
├── data/                   # PDF documents
└── .github/workflows/      # CI/CD
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google AI Studio API key | Yes |
| `PINECONE_API_KEY` | Pinecone API key | Yes |
| `PINECONE_INDEX_NAME` | Pinecone index name | No (default: steel-index) |
| `NEXT_PUBLIC_API_URL` | Backend URL | No (default: http://localhost:8000) |

## Testing

```bash
# Frontend tests
npm test

# Backend tests
pytest backend/tests/
```

## Deployment

### Quick Deploy to Azure

1. **Set up GitHub Secrets** (see [DEPLOYMENT.md](DEPLOYMENT.md))
2. **Run Infrastructure Workflow**: Actions → "Deploy Infrastructure" → Run
3. **Push to main**: Automatic deployment via "Deploy to Azure" workflow

### Manual Deployment

```bash
# Deploy infrastructure
az deployment group create \
  --resource-group steelintelswa-dev-rg \
  --template-file infra/main.bicep \
  --parameters environment=dev googleApiKey=<key> pineconeApiKey=<key>

# Deploy frontend
npm run build && npx @azure/static-web-apps-cli deploy

# Deploy backend
cd backend && func azure functionapp publish steelintelswa-func-dev
```

### GitHub Actions Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `test.yml` | Push/PR | Run tests and linting |
| `azure-deploy.yml` | Push to main | Deploy frontend & backend |
| `infra-deploy.yml` | Manual | Provision Azure resources |

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## License

MIT

---

Built by [Antigravity](https://github.com/davidfertube)
