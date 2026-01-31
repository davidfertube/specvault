-- SQLite Schema for Stress Test Metrics Collection
-- This database stores performance metrics from stress tests for analysis and regression tracking

CREATE TABLE IF NOT EXISTS test_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  scenario TEXT NOT NULL,
  git_commit TEXT,
  duration_ms INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES test_runs(id)
);

CREATE TABLE IF NOT EXISTS component_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL,
  component TEXT NOT NULL,        -- 'embedding_api', 'llm', 'vector_search', etc.
  operation TEXT NOT NULL,        -- 'generate_embedding', 'chat_completion'
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  metadata TEXT,                  -- JSON with additional context
  timestamp TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES test_runs(id)
);

CREATE TABLE IF NOT EXISTS resource_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL,
  cpu_percent REAL,
  memory_mb INTEGER,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES test_runs(id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_request_metrics_run_id ON request_metrics(run_id);
CREATE INDEX IF NOT EXISTS idx_request_metrics_endpoint ON request_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_component_metrics_run_id ON component_metrics(run_id);
CREATE INDEX IF NOT EXISTS idx_component_metrics_component ON component_metrics(component);
