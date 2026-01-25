import os
from dotenv import load_dotenv
from typing import Sequence, TypedDict, List, Dict, Any
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Pinecone as PineconeVectorStore
from langgraph.graph import StateGraph, END

load_dotenv()

# --- Configuration ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "steel-index")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY missing")

# --- Model & Vector Store ---
llm = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0)
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
vectorstore = PineconeVectorStore(index_name=PINECONE_INDEX_NAME, embedding=embeddings)

# --- State ---
class AgentState(TypedDict):
    messages: Sequence[BaseMessage]
    context: str
    sources: List[Dict[str, Any]]  # NEW: Track sources for citations

# --- Source Type ---
class Source(TypedDict):
    ref: str
    document: str
    page: str
    content_preview: str

# --- Nodes ---
def retrieve(state: AgentState):
    """Retrieve relevant documents with source metadata for citations."""
    print("--- RETRIEVING ---")
    messages = state['messages']
    last_message = messages[-1].content

    # Retrieve more docs for better coverage (k=10 instead of 5)
    docs = vectorstore.similarity_search(last_message, k=10)

    # Build context with source references for the LLM
    context_with_sources = []
    sources = []

    for i, doc in enumerate(docs):
        source_ref = f"[{i+1}]"

        # Add reference number to context
        context_with_sources.append(f"{source_ref} {doc.page_content}")

        # Track source metadata for frontend display
        sources.append({
            "ref": source_ref,
            "document": doc.metadata.get("source", "Unknown Document"),
            "page": str(doc.metadata.get("page", "N/A")),
            "content_preview": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
        })

    return {
        "context": "\n\n".join(context_with_sources),
        "sources": sources
    }

def generate(state: AgentState):
    """Generate response with citations using retrieved context."""
    print("--- GENERATING ---")
    messages = state['messages']
    context = state['context']
    question = messages[-1].content

    # Enhanced system prompt for compliance checking with citations
    prompt = f"""You are an expert material science and steel engineer specializing in:
- ASTM steel standards (A106, A53, A333, A516, etc.)
- ASME pressure vessel and piping codes (B31.3, Section VIII)
- API specifications (5L, 5CT, 650)
- NACE corrosion standards (MR0175, SP0169)

CRITICAL INSTRUCTION: Always cite your sources using [1], [2], etc. reference numbers that correspond to the context provided.

When answering:
1. Cite the specific standard/document for each claim using [N] references
2. Include exact values (yield strength, chemical composition, hardness limits) when available
3. For compliance questions, state PASS/FAIL with the specific clause/section that applies
4. If information conflicts between sources, note the discrepancy
5. If uncertain, say "Based on [N], but recommend verification with original document"

Context (with source references):
{context}

Question: {question}

Answer with citations:"""

    response = llm.invoke([HumanMessage(content=prompt)])
    return {"messages": [response]}

# --- Graph ---
workflow = StateGraph(AgentState)
workflow.add_node("retrieve", retrieve)
workflow.add_node("generate", generate)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", END)

app = workflow.compile()

# Helper function to run the graph - updated to return sources
def run_agent(query: str) -> Dict[str, Any]:
    """
    Run the RAG agent and return response with sources.

    Returns:
        dict: {
            "response": str,  # The generated answer
            "sources": list   # List of source citations
        }
    """
    inputs = {
        "messages": [HumanMessage(content=query)],
        "context": "",
        "sources": []
    }
    result = app.invoke(inputs)

    return {
        "response": result['messages'][-1].content,
        "sources": result.get('sources', [])
    }
