"""
Azure Functions entry point for SteelIntel backend.
Wraps the FastAPI app for Azure Functions deployment.
"""
import azure.functions as func
from server import app

# Create the Azure Functions app from FastAPI
main = func.AsgiFunctionApp(app=app, http_auth_level=func.AuthLevel.ANONYMOUS)
