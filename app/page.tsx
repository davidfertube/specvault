"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Github, Zap, Shield, Database, Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/search-form";
import { ResponseDisplay } from "@/components/response-display";
import { HealthIndicator } from "@/components/health-indicator";
import { Source } from "@/lib/api";

// Network visualization component (Bittensor-inspired)
function NetworkVisualization() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.05))" }}
      >
        {/* Animated network nodes and connections */}
        <g className="animate-float" style={{ animationDelay: "0s" }}>
          {/* Outer nodes */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const x = 200 + 150 * Math.cos((angle * Math.PI) / 180);
            const y = 200 + 150 * Math.sin((angle * Math.PI) / 180);
            return (
              <g key={`outer-${i}`}>
                <line
                  x1="200"
                  y1="200"
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-border"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="currentColor"
                  className="text-foreground"
                />
              </g>
            );
          })}
          {/* Inner nodes */}
          {[30, 90, 150, 210, 270, 330].map((angle, i) => {
            const x = 200 + 80 * Math.cos((angle * Math.PI) / 180);
            const y = 200 + 80 * Math.sin((angle * Math.PI) / 180);
            return (
              <g key={`inner-${i}`}>
                <line
                  x1="200"
                  y1="200"
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-border"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="currentColor"
                  className="text-muted-foreground"
                />
              </g>
            );
          })}
          {/* Center node */}
          <circle
            cx="200"
            cy="200"
            r="8"
            fill="currentColor"
            className="text-yellow"
          />
          {/* Cross connections */}
          {[0, 60, 120].map((angle, i) => {
            const x1 = 200 + 150 * Math.cos((angle * Math.PI) / 180);
            const y1 = 200 + 150 * Math.sin((angle * Math.PI) / 180);
            const x2 = 200 + 150 * Math.cos(((angle + 120) * Math.PI) / 180);
            const y2 = 200 + 150 * Math.sin(((angle + 120) * Math.PI) / 180);
            return (
              <line
                key={`cross-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="0.3"
                className="text-border"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export default function Home() {
  const [response, setResponse] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleResult = useCallback((result: string, resultSources: Source[]) => {
    setError(null);
    setResponse(result);
    setSources(resultSources);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setResponse(null);
    setError(errorMessage);
  }, []);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setResponse(null);
      setSources([]);
      setError(null);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header - Bittensor style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container-center">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-semibold tracking-tight">SteelIntel</span>
            </Link>

            {/* Desktop Navigation - Bittensor uppercase style */}
            <nav className="hidden md:flex items-center space-x-10">
              <Link href="#features" className="nav-link">
                About
              </Link>
              <Link href="#demo" className="nav-link">
                Demo
              </Link>
              <Link href="/docs" className="nav-link">
                Docs
              </Link>
              <a
                href="https://github.com/davidfertube/knowledge_tool"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link"
              >
                GitHub
              </a>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 touch-target"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-border bg-background"
          >
            <nav className="container-center py-6 space-y-4">
              <Link
                href="#features"
                className="block nav-link py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="#demo"
                className="block nav-link py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demo
              </Link>
              <Link
                href="/docs"
                className="block nav-link py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <a
                href="https://github.com/davidfertube/knowledge_tool"
                target="_blank"
                rel="noopener noreferrer"
                className="block nav-link py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                GitHub
              </a>
              <div className="pt-4">
                <HealthIndicator />
              </div>
            </nav>
          </motion.div>
        )}
      </header>

      <main className="flex-1 pt-16 sm:pt-20">
        {/* Hero Section - Bittensor inspired */}
        <section className="section-padding">
          <div className="container-center">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Text content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left"
              >
                <p className="label-section mb-4">
                  Knowledge Management for Oil & Gas
                </p>
                <h1 className="heading-hero mb-6">
                  The intelligent engine for{" "}
                  <span className="underline-yellow">steel specifications</span>
                </h1>
                <p className="prose-body mb-8 max-w-xl mx-auto lg:mx-0">
                  Instant answers from your technical documents. Query ASTM standards,
                  material properties, and compliance requirements with AI-powered
                  semantic search.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" className="btn-primary touch-target">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="btn-secondary touch-target">
                    <Github className="mr-2 h-4 w-4" />
                    View Source
                  </Button>
                </div>
              </motion.div>

              {/* Right: Network visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:block"
              >
                <NetworkVisualization />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="section-padding border-t border-border">
          <div className="container-narrow">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="label-section text-center mb-4">Try It Now</p>
              <h2 className="heading-section text-center mb-4">
                Query your knowledge base
              </h2>
              <p className="prose-body text-center mb-12 max-w-2xl mx-auto">
                Ask questions about ASTM standards, material properties, or
                compliance requirements. Get instant, cited answers.
              </p>

              {/* Search Card */}
              <div className="card-elevated rounded-lg p-6 sm:p-8">
                <SearchForm
                  onResult={handleResult}
                  onError={handleError}
                  onLoadingChange={handleLoadingChange}
                />

                {/* Response Display */}
                <div className="mt-8">
                  <ResponseDisplay
                    response={response}
                    sources={sources}
                    error={error}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section - Bittensor minimal style */}
        <section id="features" className="section-padding border-t border-border">
          <div className="container-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <p className="label-section mb-4">Why SteelIntel</p>
              <h2 className="heading-section">
                Built for engineering teams
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 mb-6">
                  <Zap className="w-8 h-8 text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold mb-3">Instant Answers</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Get precise answers from your technical documents in seconds.
                  No more manual searching through PDFs.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 mb-6">
                  <Shield className="w-8 h-8 text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold mb-3">Compliance Ready</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Every answer includes source citations. Verify compliance with
                  ASTM, ASME, API, and NACE standards.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 mb-6">
                  <Database className="w-8 h-8 text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold mb-3">Scale Ready</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Process hundreds of technical documents. Optimized vector pipeline
                  handles large specification libraries.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding border-t border-border bg-muted/30">
          <div className="container-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="heading-section mb-4">
                Ready to transform your document workflow?
              </h2>
              <p className="prose-body mb-8 max-w-2xl mx-auto">
                Join engineering teams using SteelIntel to save hours of manual
                document searching every week.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="btn-primary touch-target">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="btn-secondary touch-target">
                  Contact Sales
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer - Minimal Bittensor style */}
      <footer className="border-t border-border py-8 sm:py-12">
        <div className="container-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">SteelIntel</span>
              <span className="text-muted-foreground text-sm">
                by{" "}
                <a
                  href="https://github.com/davidfertube"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Antigravity
                </a>
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <HealthIndicator />
              <a
                href="https://github.com/davidfertube/knowledge_tool"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
