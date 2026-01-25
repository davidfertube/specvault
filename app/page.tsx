"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Github, Zap, Shield, Database, Menu, X, FileText, Boxes } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SearchForm } from "@/components/search-form";
import { ResponseDisplay } from "@/components/response-display";
import { HealthIndicator } from "@/components/health-indicator";
import { Source } from "@/lib/api";

// 3D Steel Crystal Lattice Structure (BCC - Body-Centered Cubic)
function SteelCrystalVisualization() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-yellow/10 via-transparent to-transparent blur-3xl" />

      <div className="perspective-1000 relative">
        <div className="preserve-3d rotate-y-slow">
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full"
            style={{ filter: "drop-shadow(0 0 30px rgba(0,0,0,0.1))" }}
          >
            {/* Background glow */}
            <defs>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(45, 93%, 47%)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="hsl(45, 93%, 47%)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            <circle cx="200" cy="200" r="150" fill="url(#centerGlow)" />

            {/* Outer cube edges - BCC unit cell */}
            <g className="text-foreground/30">
              {/* Front face */}
              <line x1="100" y1="100" x2="300" y2="100" stroke="url(#edgeGradient)" strokeWidth="1.5" />
              <line x1="300" y1="100" x2="300" y2="300" stroke="url(#edgeGradient)" strokeWidth="1.5" />
              <line x1="300" y1="300" x2="100" y2="300" stroke="url(#edgeGradient)" strokeWidth="1.5" />
              <line x1="100" y1="300" x2="100" y2="100" stroke="url(#edgeGradient)" strokeWidth="1.5" />

              {/* Back face (offset for 3D effect) */}
              <line x1="140" y1="60" x2="340" y2="60" stroke="url(#edgeGradient)" strokeWidth="1" opacity="0.5" />
              <line x1="340" y1="60" x2="340" y2="260" stroke="url(#edgeGradient)" strokeWidth="1" opacity="0.5" />
              <line x1="340" y1="260" x2="140" y2="260" stroke="url(#edgeGradient)" strokeWidth="1" opacity="0.5" />
              <line x1="140" y1="260" x2="140" y2="60" stroke="url(#edgeGradient)" strokeWidth="1" opacity="0.5" />

              {/* Connecting edges */}
              <line x1="100" y1="100" x2="140" y2="60" stroke="url(#edgeGradient)" strokeWidth="1" opacity="0.4" />
              <line x1="300" y1="100" x2="340" y2="60" stroke="url(#edgeGradient)" strokeWidth="1" opacity="0.4" />
              <line x1="300" y1="300" x2="340" y2="260" stroke="url(#edgeGradient)" strokeWidth="1" opacity="0.4" />
              <line x1="100" y1="300" x2="140" y2="260" stroke="url(#edgeGradient)" strokeWidth="1" opacity="0.4" />
            </g>

            {/* Diagonal connections to center atom (BCC structure) */}
            <g className="text-yellow/40">
              <line x1="100" y1="100" x2="200" y2="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="300" y1="100" x2="200" y2="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="300" y1="300" x2="200" y2="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="100" y1="300" x2="200" y2="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="140" y1="60" x2="200" y2="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
              <line x1="340" y1="60" x2="200" y2="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
              <line x1="340" y1="260" x2="200" y2="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
              <line x1="140" y1="260" x2="200" y2="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
            </g>

            {/* Corner atoms (Iron atoms in BCC) */}
            <g className="animate-pulse-glow">
              {/* Front corners */}
              <circle cx="100" cy="100" r="10" fill="currentColor" className="text-foreground" />
              <circle cx="300" cy="100" r="10" fill="currentColor" className="text-foreground" />
              <circle cx="300" cy="300" r="10" fill="currentColor" className="text-foreground" />
              <circle cx="100" cy="300" r="10" fill="currentColor" className="text-foreground" />

              {/* Back corners */}
              <circle cx="140" cy="60" r="7" fill="currentColor" className="text-foreground/60" />
              <circle cx="340" cy="60" r="7" fill="currentColor" className="text-foreground/60" />
              <circle cx="340" cy="260" r="7" fill="currentColor" className="text-foreground/60" />
              <circle cx="140" cy="260" r="7" fill="currentColor" className="text-foreground/60" />
            </g>

            {/* Center atom (Body center in BCC) - highlighted in yellow */}
            <circle cx="200" cy="180" r="14" fill="hsl(45, 93%, 47%)" className="animate-pulse-glow" />
            <circle cx="200" cy="180" r="20" fill="none" stroke="hsl(45, 93%, 47%)" strokeWidth="1" opacity="0.3" />
            <circle cx="200" cy="180" r="26" fill="none" stroke="hsl(45, 93%, 47%)" strokeWidth="0.5" opacity="0.15" />

            {/* Labels */}
            <text x="200" y="350" textAnchor="middle" className="text-xs fill-muted-foreground font-mono tracking-wider">
              BCC IRON CRYSTAL STRUCTURE
            </text>

            {/* Decorative orbits */}
            <g className="text-border/30">
              <ellipse cx="200" cy="180" rx="120" ry="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,6" />
              <ellipse cx="200" cy="180" rx="80" ry="100" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,6" transform="rotate(60 200 180)" />
            </g>
          </svg>
        </div>
      </div>

      {/* Caption */}
      <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
        Fe atoms in body-centered cubic lattice
      </p>
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container-center">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <Boxes className="w-4 h-4 text-background" />
              </div>
              <span className="text-lg font-semibold tracking-tight">SteelIntel</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="nav-link">
                Features
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
              <HealthIndicator />
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 touch-target rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
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
            <nav className="container-center py-6 space-y-1">
              <Link
                href="#features"
                className="block nav-link py-3 px-3 rounded-lg hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#demo"
                className="block nav-link py-3 px-3 rounded-lg hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demo
              </Link>
              <Link
                href="/docs"
                className="block nav-link py-3 px-3 rounded-lg hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <a
                href="https://github.com/davidfertube/knowledge_tool"
                target="_blank"
                rel="noopener noreferrer"
                className="block nav-link py-3 px-3 rounded-lg hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                GitHub
              </a>
              <Separator className="my-4" />
              <div className="px-3">
                <HealthIndicator />
              </div>
            </nav>
          </motion.div>
        )}
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="section-hero bg-gradient-mesh">
          <div className="container-center">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left: Text content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left space-y-8"
              >
                <div className="space-y-4">
                  <Badge variant="secondary" className="badge-yellow">
                    AI-Powered Knowledge Engine
                  </Badge>
                  <h1 className="heading-hero">
                    The intelligent engine for{" "}
                    <span className="underline-yellow">steel specifications</span>
                  </h1>
                  <p className="prose-body max-w-xl mx-auto lg:mx-0">
                    Instant answers from your technical documents. Query ASTM standards,
                    material properties, and compliance requirements with AI-powered
                    semantic search and source citations.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" className="btn-primary touch-target">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="btn-secondary touch-target" asChild>
                    <a
                      href="https://github.com/davidfertube/knowledge_tool"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      View Source
                    </a>
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-8 justify-center lg:justify-start pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold">100K+</p>
                    <p className="text-sm text-muted-foreground">Vector capacity</p>
                  </div>
                  <Separator orientation="vertical" className="h-12 hidden sm:block" />
                  <div className="text-center">
                    <p className="text-2xl font-semibold">50+</p>
                    <p className="text-sm text-muted-foreground">Standards supported</p>
                  </div>
                  <Separator orientation="vertical" className="h-12 hidden sm:block" />
                  <div className="text-center">
                    <p className="text-2xl font-semibold">&lt;2s</p>
                    <p className="text-sm text-muted-foreground">Query response</p>
                  </div>
                </div>
              </motion.div>

              {/* Right: 3D Crystal visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:block"
              >
                <SteelCrystalVisualization />
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
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <Badge variant="secondary" className="text-xs tracking-wider">TRY IT NOW</Badge>
                <h2 className="heading-section">
                  Query your knowledge base
                </h2>
                <p className="prose-body max-w-2xl mx-auto">
                  Ask questions about ASTM standards, material properties, or
                  compliance requirements. Get instant, cited answers.
                </p>
              </div>

              {/* Search Card */}
              <Card className="card-elevated border-0">
                <CardContent className="p-6 sm:p-8 lg:p-10">
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
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="section-padding border-t border-border bg-muted/30">
          <div className="container-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16 space-y-4"
            >
              <Badge variant="secondary" className="text-xs tracking-wider">WHY STEELINEL</Badge>
              <h2 className="heading-section">
                Built for engineering teams
              </h2>
              <p className="prose-body max-w-2xl mx-auto">
                Designed specifically for material science and compliance verification workflows.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Card className="card-subtle h-full">
                  <CardContent className="p-6 lg:p-8 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Zap className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold">Instant Answers</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Get precise answers from your technical documents in seconds.
                      No more manual searching through PDFs and spreadsheets.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="card-subtle h-full">
                  <CardContent className="p-6 lg:p-8 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <FileText className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold">Source Citations</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Every answer includes source citations with document name, page,
                      and section. Verify compliance with traceable references.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="card-subtle h-full">
                  <CardContent className="p-6 lg:p-8 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Shield className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold">Compliance Ready</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Verify compliance with ASTM, ASME, API, and NACE standards.
                      Built for engineers who need audit-ready answers.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 4 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="card-subtle h-full">
                  <CardContent className="p-6 lg:p-8 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Database className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold">Scale Ready</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Process hundreds of technical documents. Optimized vector pipeline
                      handles large specification libraries efficiently.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 5 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="card-subtle h-full">
                  <CardContent className="p-6 lg:p-8 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Boxes className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold">Semantic Search</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      AI-powered semantic search understands engineering context.
                      Find relevant information even with varied terminology.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature 6 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="card-subtle h-full">
                  <CardContent className="p-6 lg:p-8 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Github className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold">Open Source</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Fully open source and self-hostable. Deploy on your own
                      infrastructure for maximum data security and control.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding border-t border-border">
          <div className="container-narrow text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 className="heading-section">
                  Ready to transform your document workflow?
                </h2>
                <p className="prose-body max-w-2xl mx-auto">
                  Join engineering teams using SteelIntel to save hours of manual
                  document searching every week. Get started in minutes.
                </p>
              </div>
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

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-12">
        <div className="container-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <Boxes className="w-4 h-4 text-background" />
              </div>
              <div>
                <span className="font-semibold">SteelIntel</span>
                <span className="text-muted-foreground text-sm ml-2">
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
            </div>
            <div className="flex items-center gap-6">
              <HealthIndicator />
              <Separator orientation="vertical" className="h-6" />
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
          <Separator className="my-8" />
          <p className="text-center text-sm text-muted-foreground">
            Open source AI-powered RAG for steel specifications and O&G documentation.
          </p>
        </div>
      </footer>
    </div>
  );
}
