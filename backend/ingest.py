import os
import time
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_experimental.text_splitter import SemanticChunker
from langchain_community.vectorstores import Pinecone as PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "steel-index")
DATA_DIR = "./data"  # Place your PDFs here

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in .env")


def enrich_metadata(docs):
    """
    Enrich document metadata with additional fields for better citations.

    PyPDFLoader sets:
    - source: full file path
    - page: page number (0-indexed)

    We add:
    - filename: just the filename (for display)
    - page: convert to 1-indexed for human readability
    - ingested_at: timestamp
    """
    for doc in docs:
        # Extract just the filename from the full path
        source_path = doc.metadata.get("source", "")
        if source_path:
            doc.metadata["filename"] = Path(source_path).name
            # Keep original source as full path, use filename for display
            doc.metadata["source"] = Path(source_path).name

        # Convert page to 1-indexed (PyPDFLoader uses 0-indexed)
        page = doc.metadata.get("page", 0)
        doc.metadata["page"] = page + 1

        # Add ingestion timestamp
        doc.metadata["ingested_at"] = datetime.now().isoformat()

    return docs


def ingest_data():
    print("=" * 60)
    print("SteelIntel Document Ingestion")
    print("=" * 60)

    # 1. Check data directory
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"Created {DATA_DIR}/ directory.")
        print("Please add PDF documents to this folder and run again.")
        return

    pdf_files = list(Path(DATA_DIR).glob("**/*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {DATA_DIR}/")
        print("Please add PDF documents and run again.")
        return

    print(f"Found {len(pdf_files)} PDF files:")
    for f in pdf_files:
        print(f"  - {f.name}")
    print()

    # 2. Load Documents
    print("Loading documents...")
    loader = DirectoryLoader(DATA_DIR, glob="**/*.pdf", loader_cls=PyPDFLoader)
    docs = loader.load()

    if not docs:
        print("Failed to load any documents.")
        return

    print(f"Loaded {len(docs)} pages from {len(pdf_files)} files.")

    # 3. Enrich metadata for citations
    print("Enriching metadata...")
    docs = enrich_metadata(docs)

    # Show sample metadata
    if docs:
        sample = docs[0].metadata
        print(f"Sample metadata: source={sample.get('source')}, page={sample.get('page')}")

    # 4. Semantic Chunking
    print("\nPerforming semantic chunking (this may take a while)...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

    text_splitter = SemanticChunker(
        embeddings=embeddings,
        breakpoint_threshold_type="percentile",
        breakpoint_threshold_amount=85,  # Higher = more granular chunks
    )

    chunks = text_splitter.split_documents(docs)
    print(f"Created {len(chunks)} semantic chunks.")
    print(f"Average chunk size: {sum(len(c.page_content) for c in chunks) // len(chunks)} characters")

    # 5. Connect to Pinecone
    print("\nConnecting to Pinecone...")

    if not PINECONE_API_KEY:
        print("PINECONE_API_KEY is missing. Skipping upload.")
        return

    pc = Pinecone(api_key=PINECONE_API_KEY)

    # Check if index exists
    existing_indexes = [i.name for i in pc.list_indexes()]
    if INDEX_NAME not in existing_indexes:
        print(f"Creating index '{INDEX_NAME}'...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=768,  # Google embedding-001 dimension
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        # Wait for index to be ready
        print("Waiting for index to be ready...")
        while not pc.describe_index(INDEX_NAME).status["ready"]:
            time.sleep(1)
        print("Index ready!")
    else:
        print(f"Using existing index '{INDEX_NAME}'")

    # 6. Upload vectors
    print("\nUploading vectors to Pinecone...")
    print(f"This will upload {len(chunks)} vectors...")

    PineconeVectorStore.from_documents(
        chunks,
        embeddings,
        index_name=INDEX_NAME
    )

    print("\n" + "=" * 60)
    print("Ingestion Complete!")
    print("=" * 60)
    print(f"  Documents: {len(pdf_files)}")
    print(f"  Pages: {len(docs)}")
    print(f"  Chunks: {len(chunks)}")
    print(f"  Index: {INDEX_NAME}")
    print()
    print("You can now query these documents via the API.")


if __name__ == "__main__":
    ingest_data()
