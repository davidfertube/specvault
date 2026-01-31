#!/usr/bin/env tsx
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // Get A790 document IDs
  const { data: docs } = await supabase
    .from("documents")
    .select("id, filename")
    .ilike("filename", "%A790%")
    .eq("status", "indexed");

  console.log("A790 Documents:", docs);

  if (!docs || docs.length === 0) {
    console.log("No A790 documents found!");
    return;
  }

  const a790Ids = docs.map((d) => d.id);
  console.log("A790 IDs:", a790Ids);

  // Test hybrid search WITH filter
  console.log("\nTesting hybrid_search_chunks WITH filter...");
  const { data: filteredResults, error: filterError } = await supabase.rpc(
    "hybrid_search_chunks",
    {
      query_text: "S32205 yield strength",
      query_embedding: new Array(1024).fill(0.1), // Dummy embedding
      match_count: 5,
      bm25_weight: 0.3,
      vector_weight: 0.7,
      filter_document_ids: a790Ids,
    }
  );

  if (filterError) {
    console.log("Filter Error:", filterError);
  } else {
    console.log("Filtered Results Count:", filteredResults?.length);
    for (const r of filteredResults || []) {
      console.log("  - Doc ID:", r.document_id, "Content:", r.content.slice(0, 100));
    }
  }

  // Test WITHOUT filter to compare
  console.log("\nTesting hybrid_search_chunks WITHOUT filter...");
  const { data: unfilteredResults, error: unfilteredError } = await supabase.rpc(
    "hybrid_search_chunks",
    {
      query_text: "S32205 yield strength",
      query_embedding: new Array(1024).fill(0.1),
      match_count: 5,
      bm25_weight: 0.3,
      vector_weight: 0.7,
      filter_document_ids: null,
    }
  );

  if (unfilteredError) {
    console.log("Unfiltered Error:", unfilteredError);
  } else {
    console.log("Unfiltered Results Count:", unfilteredResults?.length);
    for (const r of unfilteredResults || []) {
      console.log("  - Doc ID:", r.document_id, "Content:", r.content.slice(0, 100));
    }
  }
}

main();
