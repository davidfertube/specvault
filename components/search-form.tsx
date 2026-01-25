"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryKnowledgeBase, ApiRequestError, Source } from "@/lib/api";

interface SearchFormProps {
  onResult: (response: string, sources: Source[]) => void;
  onError: (error: string) => void;
  onLoadingChange?: (loading: boolean) => void;
}

// Example queries for quick access - compliance-focused for PhD validation
const EXAMPLE_QUERIES = [
  "What is the yield strength of A106 Grade B?",
  "Does 4140 steel meet NACE MR0175 requirements?",
  "Compare A53 and A106 for high-temperature service",
  "Maximum allowable hardness for sour service?",
];

export function SearchForm({ onResult, onError, onLoadingChange }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim() || isLoading) return;

      setIsLoading(true);
      onLoadingChange?.(true);

      try {
        const result = await queryKnowledgeBase(query);
        onResult(result.response, result.sources || []);
      } catch (error) {
        if (error instanceof ApiRequestError) {
          onError(error.message);
        } else {
          onError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsLoading(false);
        onLoadingChange?.(false);
      }
    },
    [query, isLoading, onResult, onError, onLoadingChange]
  );

  const handleExampleClick = useCallback((exampleQuery: string) => {
    setQuery(exampleQuery);
  }, []);

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Input - Bittensor minimal style */}
        <div className="relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            className="input-minimal pl-8 pr-8"
            placeholder="Ask about steel specifications, compliance, or material properties..."
          />
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors touch-target"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="btn-primary touch-target"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Run Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Example Queries - Minimal chips */}
      <div className="space-y-3">
        <p className="label-section">Example queries</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((example, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs sm:text-sm text-muted-foreground
                       border border-border rounded-sm
                       hover:border-foreground hover:text-foreground
                       disabled:cursor-not-allowed disabled:opacity-50
                       transition-all duration-200 touch-target"
            >
              {example}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
