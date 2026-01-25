# Sample Data for SteelIntel

Place your PDF documents here for ingestion into the knowledge base.

## Recommended Content

For the demo, add PDFs containing:

1. **ASTM Standards** (excerpts)
   - A106 - Seamless Carbon Steel Pipe
   - A53 - Welded and Seamless Steel Pipe
   - A333 - Seamless and Welded Steel Pipe for Low-Temperature Service

2. **Material Properties**
   - Yield strength tables
   - Tensile strength data
   - Chemical composition requirements

3. **Compliance Guidelines**
   - ASME B31.3 Process Piping
   - API 5L Line Pipe specifications
   - NACE MR0175 for sour service

## Free Resources

- [ASTM](https://www.astm.org/) - Some standards available for preview
- [API](https://www.api.org/) - Technical publications
- Steel manufacturer datasheets (Nucor, US Steel, etc.)

## Ingestion

After adding PDFs, run:

```bash
python backend/ingest.py
```

This will:
1. Load all PDFs from this directory
2. Split into semantic chunks
3. Generate embeddings via Google AI
4. Store vectors in Pinecone

## Notes

- Supported formats: PDF
- Recommended: 5-20 pages per document for best results
- Large documents will be chunked automatically
