#!/usr/bin/env tsx
import dotenv from "dotenv";
import { preprocessQuery, formatExtractedCodes } from "../lib/query-preprocessing";
import { resolveSpecsToDocuments } from "../lib/document-mapper";

dotenv.config({ path: ".env.local" });

async function main() {
  const queries = [
    "What is the minimum yield strength of S32205 duplex stainless steel pipe per ASTM A790?",
    "What is the yield strength of S32205 per A790?",
    "S32205 yield A790",
    "What is the yield strength of S32205 duplex tubing per ASTM A789?",
  ];

  for (const query of queries) {
    console.log("=".repeat(60));
    console.log("Query:", query);

    const processed = preprocessQuery(query);
    console.log("Extracted codes:", formatExtractedCodes(processed.extractedCodes));
    console.log("ASTM codes:", processed.extractedCodes.astm);
    console.log("UNS codes:", processed.extractedCodes.uns);

    const documentIds = await resolveSpecsToDocuments(processed.extractedCodes);
    console.log("Document filter IDs:", documentIds);
    console.log("");
  }
}

main();
