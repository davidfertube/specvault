from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend.agent import run_agent
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SteelIntel API",
    description="AI-powered knowledge retrieval for steel specifications and O&G compliance",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request/Response Models ---

class QueryRequest(BaseModel):
    query: str

    class Config:
        json_schema_extra = {
            "example": {
                "query": "What is the yield strength of ASTM A106 Grade B?"
            }
        }

class Source(BaseModel):
    ref: str
    document: str
    page: str
    content_preview: str

    class Config:
        json_schema_extra = {
            "example": {
                "ref": "[1]",
                "document": "ASTM_A106.pdf",
                "page": "5",
                "content_preview": "ASTM A106 Grade B: Minimum yield strength 35,000 psi..."
            }
        }

class ChatResponse(BaseModel):
    response: str
    sources: List[Source]

    class Config:
        json_schema_extra = {
            "example": {
                "response": "According to ASTM A106 [1], Grade B seamless carbon steel pipe has a minimum yield strength of 35,000 psi (240 MPa).",
                "sources": [
                    {
                        "ref": "[1]",
                        "document": "ASTM_A106.pdf",
                        "page": "5",
                        "content_preview": "ASTM A106 Grade B: Minimum yield strength 35,000 psi..."
                    }
                ]
            }
        }

class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"

# --- Endpoints ---

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: QueryRequest):
    """
    Query the steel knowledge base.

    Returns an AI-generated response with source citations.
    Each citation includes document name, page number, and content preview.
    """
    try:
        result = run_agent(request.query)
        return ChatResponse(
            response=result["response"],
            sources=[Source(**s) for s in result["sources"]]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(status="ok")
