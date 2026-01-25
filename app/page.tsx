"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Github, Zap, Shield, Database, Menu, X, FileText, Boxes } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SearchForm } from "@/components/search-form";
import { ResponseDisplay } from "@/components/response-display";
import { HealthIndicator } from "@/components/health-indicator";
import { Source } from "@/lib/api";

// AI Face Recognition Visualization - Lines and Dots
function AIFaceVisualization() {
  // Face outline points (stylized AI face shape)
  const facePoints = [
    // Forehead curve
    { x: 200, y: 60 },
    { x: 240, y: 55 },
    { x: 280, y: 60 },
    { x: 310, y: 80 },
    // Right side of face
    { x: 330, y: 120 },
    { x: 340, y: 170 },
    { x: 335, y: 220 },
    { x: 320, y: 270 },
    // Chin
    { x: 290, y: 310 },
    { x: 250, y: 330 },
    { x: 200, y: 340 },
    { x: 150, y: 330 },
    { x: 110, y: 310 },
    // Left side of face
    { x: 80, y: 270 },
    { x: 65, y: 220 },
    { x: 60, y: 170 },
    { x: 70, y: 120 },
    // Back to forehead
    { x: 90, y: 80 },
    { x: 120, y: 60 },
    { x: 160, y: 55 },
  ];

  // Eye points
  const leftEye = [
    { x: 130, y: 160 },
    { x: 145, y: 150 },
    { x: 165, y: 150 },
    { x: 180, y: 160 },
    { x: 165, y: 170 },
    { x: 145, y: 170 },
  ];

  const rightEye = [
    { x: 220, y: 160 },
    { x: 235, y: 150 },
    { x: 255, y: 150 },
    { x: 270, y: 160 },
    { x: 255, y: 170 },
    { x: 235, y: 170 },
  ];

  // Nose points
  const nose = [
    { x: 200, y: 180 },
    { x: 190, y: 230 },
    { x: 200, y: 245 },
    { x: 210, y: 230 },
  ];

  // Mouth points
  const mouth = [
    { x: 150, y: 280 },
    { x: 175, y: 275 },
    { x: 200, y: 280 },
    { x: 225, y: 275 },
    { x: 250, y: 280 },
  ];

  // Neural network connection points
  const neuralPoints = [
    { x: 50, y: 100 }, { x: 30, y: 200 }, { x: 45, y: 300 },
    { x: 350, y: 100 }, { x: 370, y: 200 }, { x: 355, y: 300 },
    { x: 100, y: 30 }, { x: 200, y: 20 }, { x: 300, y: 30 },
    { x: 100, y: 370 }, { x: 200, y: 380 }, { x: 300, y: 370 },
  ];

  return (
    <div className="relative w-full max-w-xl mx-auto h-[400px] lg:h-[480px]">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        {/* Scanning lines effect */}
        <motion.line
          x1="0" y1="0" x2="400" y2="0"
          stroke="rgba(239, 68, 68, 0.3)"
          strokeWidth="2"
          animate={{ y1: [0, 400, 0], y2: [0, 400, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        {/* Neural network connections to face */}
        {neuralPoints.map((point, i) => (
          <motion.g key={`neural-${i}`}>
            <motion.line
              x1={point.x}
              y1={point.y}
              x2={200}
              y2={200}
              stroke="black"
              strokeWidth="0.5"
              strokeDasharray="4,4"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
            />
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill="black"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
            />
          </motion.g>
        ))}

        {/* Face outline with animated dots */}
        {facePoints.map((point, i) => (
          <motion.circle
            key={`face-${i}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="black"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.08,
            }}
          />
        ))}

        {/* Face outline connections */}
        <motion.path
          d={`M ${facePoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`}
          fill="none"
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Left eye */}
        <motion.path
          d={`M ${leftEye.map(p => `${p.x},${p.y}`).join(' L ')} Z`}
          fill="none"
          stroke="black"
          strokeWidth="1.5"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {leftEye.map((point, i) => (
          <motion.circle
            key={`left-eye-${i}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="black"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
        {/* Left pupil */}
        <motion.circle
          cx="155"
          cy="160"
          r="6"
          fill="black"
          animate={{ scale: [1, 0.8, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Right eye */}
        <motion.path
          d={`M ${rightEye.map(p => `${p.x},${p.y}`).join(' L ')} Z`}
          fill="none"
          stroke="black"
          strokeWidth="1.5"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {rightEye.map((point, i) => (
          <motion.circle
            key={`right-eye-${i}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="black"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
        {/* Right pupil */}
        <motion.circle
          cx="245"
          cy="160"
          r="6"
          fill="black"
          animate={{ scale: [1, 0.8, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Nose */}
        <motion.path
          d={`M ${nose.map(p => `${p.x},${p.y}`).join(' L ')}`}
          fill="none"
          stroke="black"
          strokeWidth="1.5"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        {nose.map((point, i) => (
          <motion.circle
            key={`nose-${i}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="black"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}

        {/* Mouth */}
        <motion.path
          d={`M ${mouth.map(p => `${p.x},${p.y}`).join(' L ')}`}
          fill="none"
          stroke="black"
          strokeWidth="1.5"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {mouth.map((point, i) => (
          <motion.circle
            key={`mouth-${i}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="black"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}

        {/* Recognition frame corners */}
        <motion.g
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {/* Top-left corner */}
          <path d="M 50 80 L 50 50 L 80 50" fill="none" stroke="#ef4444" strokeWidth="3" />
          {/* Top-right corner */}
          <path d="M 320 50 L 350 50 L 350 80" fill="none" stroke="#ef4444" strokeWidth="3" />
          {/* Bottom-left corner */}
          <path d="M 50 320 L 50 350 L 80 350" fill="none" stroke="#ef4444" strokeWidth="3" />
          {/* Bottom-right corner */}
          <path d="M 320 350 L 350 350 L 350 320" fill="none" stroke="#ef4444" strokeWidth="3" />
        </motion.g>

        {/* Red accent square in center */}
        <motion.rect
          x="185"
          y="185"
          width="30"
          height="30"
          fill="#ef4444"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "200px 200px" }}
        />

        {/* Data processing indicators */}
        <motion.text
          x="55"
          y="45"
          fontSize="8"
          fill="black"
          opacity="0.5"
          fontFamily="monospace"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ANALYZING...
        </motion.text>
        <motion.text
          x="290"
          y="365"
          fontSize="8"
          fill="black"
          opacity="0.5"
          fontFamily="monospace"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
        >
          AI PROCESSING
        </motion.text>
      </svg>

      {/* Floating red squares around the visualization */}
      <motion.div
        className="absolute top-[5%] right-[10%] w-4 h-4 bg-red-500"
        animate={{ y: [0, -15, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-[10%] left-[5%] w-3 h-3 bg-red-500/70"
        animate={{ y: [0, 10, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute top-[40%] left-[2%] w-2 h-2 bg-red-500/50"
        animate={{ x: [0, 10, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[5%] w-3 h-3 bg-red-500/60"
        animate={{ y: [0, -10, 0], x: [0, 5, 0], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.8 }}
      />
    </div>
  );
}

// Floating red square component
function FloatingRedSquare({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`absolute w-3 h-3 bg-red-500 ${className}`}
      animate={{
        y: [0, -10, 0],
        opacity: [0.6, 1, 0.6],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
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
    <div className="flex min-h-screen flex-col bg-white text-black overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
        <div className="container-center">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black flex items-center justify-center">
                <Boxes className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-black">SteelIntel</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-black/60 hover:text-black transition-colors">
                Features
              </Link>
              <Link href="#demo" className="text-sm text-black/60 hover:text-black transition-colors">
                Demo
              </Link>
              <Link href="/docs" className="text-sm text-black/60 hover:text-black transition-colors">
                Docs
              </Link>
              <a
                href="https://github.com/davidfertube/knowledge_tool"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-black/60 hover:text-black transition-colors"
              >
                GitHub
              </a>
              <HealthIndicator />
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 touch-target rounded hover:bg-black/5 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-black" />
              ) : (
                <Menu className="h-5 w-5 text-black" />
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
            className="md:hidden border-t border-black/5 bg-white"
          >
            <nav className="container-center py-6 space-y-1">
              <Link
                href="#features"
                className="block py-3 px-3 text-sm text-black/60 hover:text-black hover:bg-black/5 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#demo"
                className="block py-3 px-3 text-sm text-black/60 hover:text-black hover:bg-black/5 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demo
              </Link>
              <Link
                href="/docs"
                className="block py-3 px-3 text-sm text-black/60 hover:text-black hover:bg-black/5 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <a
                href="https://github.com/davidfertube/knowledge_tool"
                target="_blank"
                rel="noopener noreferrer"
                className="block py-3 px-3 text-sm text-black/60 hover:text-black hover:bg-black/5 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                GitHub
              </a>
              <Separator className="my-4 bg-black/10" />
              <div className="px-3">
                <HealthIndicator />
              </div>
            </nav>
          </motion.div>
        )}
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 md:py-24 lg:py-32 overflow-hidden">
          {/* Background floating red squares */}
          <FloatingRedSquare className="top-20 left-[5%] hidden lg:block" />
          <FloatingRedSquare className="top-40 right-[8%] hidden lg:block" />
          <FloatingRedSquare className="bottom-32 left-[12%] hidden lg:block" />

          <div className="container-center">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Text content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left space-y-8"
              >
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 border border-black/10 rounded-full text-xs font-medium text-black/70">
                    <span className="w-2 h-2 bg-red-500 rounded-sm" />
                    AI-Powered Knowledge Engine
                  </div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] text-black">
                    The intelligent engine for{" "}
                    <span className="relative">
                      steel specifications
                      <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-red-500" />
                    </span>
                  </h1>
                  <p className="text-lg text-black/70 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    Instant answers from your technical documents. Query ASTM standards,
                    material properties, and compliance requirements with AI-powered
                    semantic search and source citations.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" className="bg-black text-white hover:bg-black/90 h-12 px-8">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-black/20 text-black hover:bg-black/5 h-12 px-8" asChild>
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
                <div className="flex flex-wrap gap-10 justify-center lg:justify-start pt-6">
                  <div>
                    <p className="text-3xl font-semibold text-black">100K+</p>
                    <p className="text-sm text-black/60">Vector capacity</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold text-black">50+</p>
                    <p className="text-sm text-black/60">Standards</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold text-black">&lt;2s</p>
                    <p className="text-sm text-black/60">Response time</p>
                  </div>
                </div>
              </motion.div>

              {/* Right: AI Face visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:block"
              >
                <AIFaceVisualization />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="relative py-16 sm:py-20 md:py-24 border-t border-black/5">
          <FloatingRedSquare className="top-16 right-[6%] hidden lg:block" />

          <div className="container-narrow">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-black/10 rounded-full text-xs font-medium text-black/70">
                  <span className="w-2 h-2 bg-red-500 rounded-sm" />
                  TRY IT NOW
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-black">
                  Query your knowledge base
                </h2>
                <p className="text-lg text-black/70 max-w-2xl mx-auto">
                  Ask questions about ASTM standards, material properties, or
                  compliance requirements. Get instant, cited answers.
                </p>
              </div>

              {/* Search Card */}
              <Card className="border border-black/10 shadow-lg shadow-black/5 bg-white">
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
        <section id="features" className="relative py-16 sm:py-20 md:py-24 border-t border-black/5 bg-black/[0.02]">
          <FloatingRedSquare className="top-24 left-[4%] hidden lg:block" />
          <FloatingRedSquare className="bottom-20 right-[10%] hidden lg:block" />

          <div className="container-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16 space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-black/10 rounded-full text-xs font-medium text-black/70">
                <span className="w-2 h-2 bg-red-500 rounded-sm" />
                WHY STEELINEL
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-black">
                Built for engineering teams
              </h2>
              <p className="text-lg text-black/70 max-w-2xl mx-auto">
                Designed specifically for material science and compliance verification workflows.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  icon: Zap,
                  title: "Instant Answers",
                  description: "Get precise answers from your technical documents in seconds. No more manual searching through PDFs and spreadsheets.",
                  delay: 0,
                },
                {
                  icon: FileText,
                  title: "Source Citations",
                  description: "Every answer includes source citations with document name, page, and section. Verify compliance with traceable references.",
                  delay: 0.1,
                },
                {
                  icon: Shield,
                  title: "Compliance Ready",
                  description: "Verify compliance with ASTM, ASME, API, and NACE standards. Built for engineers who need audit-ready answers.",
                  delay: 0.2,
                },
                {
                  icon: Database,
                  title: "Scale Ready",
                  description: "Process hundreds of technical documents. Optimized vector pipeline handles large specification libraries efficiently.",
                  delay: 0.3,
                },
                {
                  icon: Boxes,
                  title: "Semantic Search",
                  description: "AI-powered semantic search understands engineering context. Find relevant information even with varied terminology.",
                  delay: 0.4,
                },
                {
                  icon: Github,
                  title: "Open Source",
                  description: "Fully open source and self-hostable. Deploy on your own infrastructure for maximum data security and control.",
                  delay: 0.5,
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: feature.delay }}
                >
                  <Card className="h-full border border-black/10 hover:border-black/20 transition-colors bg-white">
                    <CardContent className="p-6 lg:p-8 space-y-4">
                      <div className="w-12 h-12 bg-black/5 flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-black" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg font-semibold text-black">{feature.title}</h3>
                      <p className="text-black/70 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 sm:py-20 md:py-24 border-t border-black/5">
          <FloatingRedSquare className="top-12 left-[15%] hidden lg:block" />
          <FloatingRedSquare className="bottom-16 right-[12%] hidden lg:block" />

          <div className="container-narrow text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-black">
                  Ready to transform your<br />document workflow?
                </h2>
                <p className="text-lg text-black/70 max-w-2xl mx-auto">
                  Join engineering teams using SteelIntel to save hours of manual
                  document searching every week.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-black text-white hover:bg-black/90 h-12 px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-black/20 text-black hover:bg-black/5 h-12 px-8">
                  Contact Sales
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 py-8 sm:py-12 bg-white">
        <div className="container-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black flex items-center justify-center">
                <Boxes className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-semibold text-black">SteelIntel</span>
                <span className="text-black/60 text-sm ml-2">
                  by{" "}
                  <a
                    href="https://github.com/davidfertube"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-black transition-colors"
                  >
                    Antigravity
                  </a>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <HealthIndicator />
              <Separator orientation="vertical" className="h-6 bg-black/10" />
              <a
                href="https://github.com/davidfertube/knowledge_tool"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/60 hover:text-black transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          <Separator className="my-8 bg-black/5" />
          <p className="text-center text-sm text-black/60">
            Open source AI-powered RAG for steel specifications and O&G documentation.
          </p>
        </div>
      </footer>
    </div>
  );
}
