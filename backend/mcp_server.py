"""
MCP Server for Steel Knowledge Tool.

Exposes tools for querying steel specifications, checking compliance,
and managing the knowledge base via the Model Context Protocol.

Usage:
    python -m backend.mcp_server

Tools provided:
    - query_steel_specs: Search the steel specifications database
    - check_compliance: Verify material meets requirements (NACE, ASTM, API)
    - compare_materials: Compare properties of multiple steel grades
    - ingest_document: Add a new PDF to the knowledge base
    - list_documents: Show all indexed documents
    - get_health: Check backend health status
"""

import asyncio
import json
import os
import sys
from typing import Any

# MCP SDK imports
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    print("MCP SDK not installed. Install with: pip install mcp")
    sys.exit(1)

# Add backend to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server import get_demo_response, DEMO_MODE

# Initialize MCP server
server = Server("steel-knowledge")

# Check if we have real API access or demo mode
if not DEMO_MODE:
    try:
        from agent import run_agent, vectorstore
        HAS_REAL_BACKEND = True
    except ImportError:
        HAS_REAL_BACKEND = False
else:
    HAS_REAL_BACKEND = False


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List all available tools."""
    return [
        Tool(
            name="query_steel_specs",
            description="Search the steel specifications database for information about materials, standards, and properties. Returns response with source citations.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The question about steel specifications (e.g., 'What is the yield strength of A106 Grade B?')"
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="check_compliance",
            description="Check if a material meets specific compliance requirements (NACE MR0175, ASTM, API standards).",
            inputSchema={
                "type": "object",
                "properties": {
                    "material": {
                        "type": "string",
                        "description": "The material to check (e.g., '4140 steel', 'A106 Grade B')"
                    },
                    "standard": {
                        "type": "string",
                        "description": "The compliance standard (e.g., 'NACE MR0175', 'ASTM A106', 'API 5L')"
                    },
                    "requirements": {
                        "type": "string",
                        "description": "Specific requirements to check (e.g., 'sour service', 'high temperature')"
                    }
                },
                "required": ["material", "standard"]
            }
        ),
        Tool(
            name="compare_materials",
            description="Compare properties of multiple steel grades or materials.",
            inputSchema={
                "type": "object",
                "properties": {
                    "materials": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of materials to compare (e.g., ['A106 Grade B', 'A53 Type E'])"
                    },
                    "properties": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Properties to compare (e.g., ['yield strength', 'tensile strength', 'chemistry'])"
                    }
                },
                "required": ["materials"]
            }
        ),
        Tool(
            name="list_documents",
            description="List all documents currently indexed in the knowledge base.",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="get_health",
            description="Check the health status of the steel knowledge backend.",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Handle tool calls."""

    if name == "query_steel_specs":
        query = arguments.get("query", "")

        if HAS_REAL_BACKEND:
            # Use real RAG pipeline
            result = run_agent(query)
            response_text = result.get("response", result) if isinstance(result, dict) else str(result)
            sources = result.get("sources", []) if isinstance(result, dict) else []
        else:
            # Use demo mode
            result = get_demo_response(query)
            response_text = result["response"]
            sources = result["sources"]

        # Format response with sources
        output = f"**Response:**\n{response_text}\n\n"
        if sources:
            output += "**Sources:**\n"
            for source in sources:
                output += f"- {source['ref']} {source['document']} (p. {source['page']})\n"

        return [TextContent(type="text", text=output)]

    elif name == "check_compliance":
        material = arguments.get("material", "")
        standard = arguments.get("standard", "")
        requirements = arguments.get("requirements", "")

        # Build compliance query
        query = f"Does {material} meet {standard} requirements"
        if requirements:
            query += f" for {requirements}"
        query += "?"

        if HAS_REAL_BACKEND:
            result = run_agent(query)
            response_text = result.get("response", result) if isinstance(result, dict) else str(result)
            sources = result.get("sources", []) if isinstance(result, dict) else []
        else:
            result = get_demo_response(query)
            response_text = result["response"]
            sources = result["sources"]

        output = f"**Compliance Check: {material} vs {standard}**\n\n{response_text}\n\n"
        if sources:
            output += "**Reference Documents:**\n"
            for source in sources:
                output += f"- {source['ref']} {source['document']} (p. {source['page']})\n"

        return [TextContent(type="text", text=output)]

    elif name == "compare_materials":
        materials = arguments.get("materials", [])
        properties = arguments.get("properties", ["yield strength", "tensile strength"])

        if len(materials) < 2:
            return [TextContent(type="text", text="Error: Please provide at least 2 materials to compare.")]

        # Build comparison query
        materials_str = " and ".join(materials)
        props_str = ", ".join(properties) if properties else "properties"
        query = f"Compare {materials_str} for {props_str}"

        if HAS_REAL_BACKEND:
            result = run_agent(query)
            response_text = result.get("response", result) if isinstance(result, dict) else str(result)
            sources = result.get("sources", []) if isinstance(result, dict) else []
        else:
            result = get_demo_response(query)
            response_text = result["response"]
            sources = result["sources"]

        output = f"**Material Comparison: {materials_str}**\n\n{response_text}\n\n"
        if sources:
            output += "**Sources:**\n"
            for source in sources:
                output += f"- {source['ref']} {source['document']} (p. {source['page']})\n"

        return [TextContent(type="text", text=output)]

    elif name == "list_documents":
        # In demo mode, return sample document list
        if HAS_REAL_BACKEND and hasattr(vectorstore, 'list_documents'):
            docs = vectorstore.list_documents()
        else:
            docs = [
                {"name": "ASTM_A106.pdf", "pages": 12, "status": "indexed"},
                {"name": "ASTM_A53.pdf", "pages": 8, "status": "indexed"},
                {"name": "NACE_MR0175_ISO15156.pdf", "pages": 45, "status": "indexed"},
                {"name": "AISI_4140_DataSheet.pdf", "pages": 4, "status": "indexed"},
                {"name": "ASTM_A333.pdf", "pages": 10, "status": "indexed"},
            ]

        output = "**Indexed Documents:**\n\n"
        for doc in docs:
            output += f"- {doc['name']} ({doc.get('pages', 'N/A')} pages) - {doc.get('status', 'indexed')}\n"

        mode = "production" if HAS_REAL_BACKEND else "demo"
        output += f"\n*Mode: {mode}*"

        return [TextContent(type="text", text=output)]

    elif name == "get_health":
        status = {
            "status": "ok",
            "version": "1.0.0",
            "mode": "production" if HAS_REAL_BACKEND else "demo",
            "pinecone_connected": HAS_REAL_BACKEND,
            "google_ai_connected": HAS_REAL_BACKEND,
        }

        output = "**Steel Knowledge Backend Health**\n\n"
        output += f"- Status: {status['status']}\n"
        output += f"- Version: {status['version']}\n"
        output += f"- Mode: {status['mode']}\n"
        output += f"- Pinecone: {'Connected' if status['pinecone_connected'] else 'Not connected'}\n"
        output += f"- Google AI: {'Connected' if status['google_ai_connected'] else 'Not connected'}\n"

        return [TextContent(type="text", text=output)]

    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
