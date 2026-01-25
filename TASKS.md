# SteelIntel - Implementation Tasks

## MVP Status: In Progress

### Phase 1: Foundation (COMPLETED)
- [x] Project structure setup (Next.js 16, FastAPI)
- [x] Environment configuration (.env.example)
- [x] CLAUDE.md documentation
- [x] README.md with quick start
- [x] Git repository setup

### Phase 2: Core Features (COMPLETED)
- [x] Frontend UI with search form
- [x] Backend RAG pipeline (LangGraph)
- [x] API integration (lib/api.ts)
- [x] Response display with typewriter effect
- [x] Health indicator component
- [x] Mobile navigation

### Phase 3: Source Citations (COMPLETED)
- [x] Backend: Return sources with metadata in agent.py
- [x] Backend: Update API response schema in server.py
- [x] Backend: Ensure metadata stored in ingest.py
- [x] Frontend: Update response types in lib/api.ts
- [x] Frontend: Display expandable sources in response-display.tsx
- [x] Frontend: Pass sources through page.tsx

### Phase 4: UI/UX Polish (COMPLETED)
- [x] Bittensor-inspired design system
- [x] Clean typography with uppercase section labels
- [x] Network visualization hero graphic
- [x] Mobile-first responsive design
- [x] Touch-friendly tap targets (44px minimum)
- [x] Minimal input styling (underline style)
- [x] Subtle animations (fade, slide, float)

### Phase 5: Azure Deployment (COMPLETED)
- [x] GitHub Actions workflow (azure-deploy.yml)
- [x] Infrastructure deployment workflow (infra-deploy.yml)
- [x] Bicep templates for Azure resources
- [x] Azure Functions backend configuration
- [x] DEPLOYMENT.md documentation

### Phase 6: Testing (COMPLETED)
- [x] Frontend unit tests (Vitest)
- [x] Backend unit tests (pytest)
- [x] CI/CD test workflow (test.yml)
- [x] API client tests
- [x] Search form tests

---

## Upcoming Tasks

### Phase 7: PhD Demo Preparation
- [ ] Source 20-50 sample PDFs (ASTM, ASME, NACE)
- [ ] Run document ingestion
- [ ] Verify retrieval quality with test queries
- [ ] Test compliance checking queries
- [ ] Validate source citations accuracy

### Phase 8: Azure Deployment (Live)
- [ ] Create Azure service principal
- [ ] Configure GitHub secrets
- [ ] Run infrastructure deployment
- [ ] Deploy frontend to Static Web App
- [ ] Deploy backend to Azure Functions
- [ ] Configure CORS and environment variables
- [ ] Verify end-to-end functionality

### Phase 9: Portfolio Integration
- [ ] Update portfolio project card
- [ ] Create project screenshot (1200x630)
- [ ] Write project description
- [ ] Add live demo link
- [ ] Remove/archive old RAG project

---

## Quick Reference

### Local Development
```bash
# Frontend
npm run dev

# Backend
uvicorn backend.server:app --reload --port 8000

# Tests
npm test
pytest backend/tests/
```

### Azure Deployment
```bash
# Infrastructure
gh workflow run infra-deploy.yml -f environment=dev

# Application
git push origin main  # Triggers azure-deploy.yml
```

### Document Ingestion
```bash
# Add PDFs to data/
python backend/ingest.py
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main landing page |
| `components/search-form.tsx` | Search input with examples |
| `components/response-display.tsx` | AI response with sources |
| `lib/api.ts` | API client for backend |
| `backend/agent.py` | LangGraph RAG pipeline |
| `backend/server.py` | FastAPI endpoints |
| `backend/ingest.py` | PDF ingestion |
| `infra/main.bicep` | Azure infrastructure |

---

## Environment Variables

### Required
- `GOOGLE_API_KEY` - Google AI Studio
- `PINECONE_API_KEY` - Pinecone
- `PINECONE_INDEX_NAME` - Index name (default: steel-index)

### Optional
- `NEXT_PUBLIC_API_URL` - Backend URL (default: http://localhost:8000)

---

## Test Queries for PhD Demo

1. **Material Properties**
   - "What is the yield strength of A106 Grade B?"
   - "Chemical composition requirements for A333 Grade 6?"

2. **Compliance Checking**
   - "Does 4140 steel meet NACE MR0175 requirements?"
   - "What is the maximum allowable hardness for sour service?"

3. **Comparison**
   - "Compare A53 and A106 for high-temperature service"
   - "Differences between ASTM A106 and A333?"

4. **Specific Standards**
   - "What does NACE MR0175 require for carbon steel?"
   - "ASME B31.3 allowable stress for A106 Grade B at 400F?"
