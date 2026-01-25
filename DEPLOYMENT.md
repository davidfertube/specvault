# SteelIntel Azure Deployment Guide

This guide walks you through deploying SteelIntel to Azure using GitHub Actions.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Cloud                               │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │ Static Web App   │ ──API──▶│ Azure Functions (Python)     │  │
│  │ (Next.js Frontend)│         │ ┌────────────────────────┐  │  │
│  │                  │         │ │ FastAPI + LangGraph    │  │  │
│  └──────────────────┘         │ │ RAG Pipeline           │  │  │
│                               │ └────────────────────────┘  │  │
│                               │            │                 │  │
│                               │            ▼                 │  │
│                               │ ┌────────────────────────┐  │  │
│                               │ │ Google Gemini API      │  │  │
│                               │ └────────────────────────┘  │  │
│                               │            │                 │  │
│                               │            ▼                 │  │
│                               │ ┌────────────────────────┐  │  │
│                               │ │ Pinecone Vector DB     │  │  │
│                               │ └────────────────────────┘  │  │
│                               └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Azure Account** with an active subscription
2. **GitHub Account** with access to this repository
3. **API Keys**:
   - Google API Key (from [Google AI Studio](https://makersuite.google.com/app/apikey))
   - Pinecone API Key (from [Pinecone Console](https://app.pinecone.io/))

## Quick Start (Automated)

### Step 1: Set up Azure Service Principal

```bash
# Login to Azure
az login

# Create a service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "steelintelswa-github" \
  --role contributor \
  --scopes /subscriptions/<your-subscription-id> \
  --sdk-auth
```

Save the output JSON - you'll need it for GitHub secrets.

### Step 2: Configure GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these **secrets**:

| Secret Name | Description |
|-------------|-------------|
| `AZURE_CLIENT_ID` | Client ID from service principal |
| `AZURE_TENANT_ID` | Tenant ID from service principal |
| `AZURE_SUBSCRIPTION_ID` | Your Azure subscription ID |
| `GOOGLE_API_KEY` | Google Generative AI API key |
| `PINECONE_API_KEY` | Pinecone API key |

### Step 3: Deploy Infrastructure

1. Go to Actions → "Deploy Infrastructure"
2. Click "Run workflow"
3. Select environment (dev/staging/prod)
4. Click "Run workflow"

This creates:
- Azure Static Web App (Frontend)
- Azure Function App (Backend)
- Storage Account
- Application Insights

### Step 4: Get Deployment Tokens

After infrastructure deployment, get the deployment tokens:

```bash
# Get Static Web App token
az staticwebapp secrets list \
  --name steelintelswa-dev \
  --query properties.apiKey \
  --output tsv

# Get Function App publish profile
az functionapp deployment list-publishing-profiles \
  --name steelintelswa-func-dev \
  --resource-group steelintelswa-dev-rg \
  --xml
```

Add these to GitHub secrets:
- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

### Step 5: Deploy Application

Push to `main` branch or manually trigger "Deploy to Azure" workflow.

## Manual Deployment

### Deploy Infrastructure with Azure CLI

```bash
# Create resource group
az group create --name steelintelswa-dev-rg --location eastus

# Deploy Bicep template
az deployment group create \
  --resource-group steelintelswa-dev-rg \
  --template-file infra/main.bicep \
  --parameters \
    environment=dev \
    googleApiKey=<your-key> \
    pineconeApiKey=<your-key>
```

### Deploy Frontend

```bash
# Build the frontend
npm run build

# Deploy to Static Web App
npx @azure/static-web-apps-cli deploy \
  --app-location .next \
  --deployment-token <your-token>
```

### Deploy Backend

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Deploy to Azure Functions
cd backend
func azure functionapp publish steelintelswa-func-dev
```

## Environment Variables

### Frontend (Static Web App)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (auto-configured) |

### Backend (Function App)
| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Google Generative AI API key |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX_NAME` | Pinecone index name (default: steel-index) |

## Monitoring

### Application Insights

View logs and metrics in Azure Portal:
1. Go to your resource group
2. Click on Application Insights resource
3. View Live Metrics, Logs, Performance

### Function App Logs

```bash
# Stream logs
az functionapp log tail \
  --name steelintelswa-func-dev \
  --resource-group steelintelswa-dev-rg
```

## Cost Estimation

| Resource | Tier | Est. Monthly Cost |
|----------|------|-------------------|
| Static Web App | Free | $0 |
| Function App | Consumption | ~$0-5 (pay per execution) |
| Storage Account | Standard LRS | ~$1-2 |
| Application Insights | Pay-as-you-go | ~$0-5 |

**Total**: ~$1-12/month for development workloads

## Troubleshooting

### Common Issues

**CORS Errors**
- Check that the Static Web App URL is in Function App CORS settings
- Verify `NEXT_PUBLIC_API_URL` is set correctly

**Function App Not Responding**
- Check Application Insights for errors
- Verify API keys are set in Function App configuration

**Build Failures**
- Run `npm run build` locally to check for errors
- Check GitHub Actions logs for specific error messages

### Debug Locally

```bash
# Start backend
cd backend
func start

# Start frontend (in another terminal)
npm run dev
```

## Security Best Practices

1. **Never commit API keys** - Use GitHub secrets and Azure Key Vault
2. **Enable HTTPS only** - Already configured in Bicep template
3. **Use managed identity** where possible
4. **Review CORS settings** - Only allow necessary origins
5. **Enable Application Insights** for security monitoring

## Scaling

For production workloads:

1. **Upgrade Static Web App** to Standard tier ($9/month) for:
   - Custom domains
   - More build minutes
   - Staging environments

2. **Upgrade Function App** to Premium plan for:
   - No cold starts
   - VNet integration
   - More memory/CPU

3. **Add Azure Front Door** for:
   - Global CDN
   - WAF protection
   - Custom SSL certificates
