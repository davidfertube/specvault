"""
Tests for the FastAPI server endpoints.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, MagicMock

# We'll import the app after patching to avoid initialization errors
# when environment variables are missing


@pytest.fixture
def mock_env():
    """Mock environment variables for testing."""
    with patch.dict('os.environ', {
        'GOOGLE_API_KEY': 'test_google_key',
        'PINECONE_API_KEY': 'test_pinecone_key',
        'PINECONE_INDEX_NAME': 'test-index',
    }):
        yield


@pytest.fixture
def mock_agent():
    """Mock the agent module to avoid external API calls."""
    with patch('backend.agent.llm') as mock_llm, \
         patch('backend.agent.vectorstore') as mock_vs, \
         patch('backend.agent.run_agent') as mock_run:
        mock_run.return_value = "Mocked response about steel specifications."
        yield mock_run


@pytest.mark.asyncio
async def test_health_endpoint(mock_env, mock_agent):
    """Test the /health endpoint returns OK status."""
    with patch('backend.server.run_agent', mock_agent):
        from backend.server import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/health")

            assert response.status_code == 200
            assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_chat_endpoint_success(mock_env):
    """Test the /api/chat endpoint with successful response."""
    with patch('backend.server.run_agent') as mock_run:
        mock_run.return_value = "A106 Grade B has a minimum yield strength of 35,000 psi."

        from backend.server import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={"query": "What is the yield strength of A106 Grade B?"}
            )

            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            assert "yield strength" in data["response"].lower() or "35,000" in data["response"]


@pytest.mark.asyncio
async def test_chat_endpoint_empty_query(mock_env):
    """Test the /api/chat endpoint with empty query."""
    with patch('backend.server.run_agent') as mock_run:
        mock_run.return_value = ""

        from backend.server import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={"query": ""}
            )

            # Should still return 200, even with empty query
            assert response.status_code == 200


@pytest.mark.asyncio
async def test_chat_endpoint_error(mock_env):
    """Test the /api/chat endpoint when agent raises an error."""
    with patch('backend.server.run_agent') as mock_run:
        mock_run.side_effect = Exception("Agent processing failed")

        from backend.server import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={"query": "test query"}
            )

            assert response.status_code == 500
            data = response.json()
            assert "detail" in data


@pytest.mark.asyncio
async def test_chat_endpoint_invalid_json(mock_env, mock_agent):
    """Test the /api/chat endpoint with invalid JSON."""
    with patch('backend.server.run_agent', mock_agent):
        from backend.server import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                content="not valid json",
                headers={"Content-Type": "application/json"}
            )

            assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_cors_headers(mock_env, mock_agent):
    """Test that CORS headers are properly set."""
    with patch('backend.server.run_agent', mock_agent):
        from backend.server import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.options(
                "/api/chat",
                headers={
                    "Origin": "http://localhost:3000",
                    "Access-Control-Request-Method": "POST",
                }
            )

            # CORS preflight should succeed
            assert response.status_code == 200
