/**
 * Query Storm Stress Test
 *
 * Simulates 20-50 concurrent users querying the RAG system.
 * Tests: LLM rate limits, embedding cache, search performance under load.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '2m', target: 20 },   // Sustained load
    { duration: '1m', target: 50 },   // Spike to 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration{endpoint:chat}': ['p95<10000'],  // P95 < 10s
    'http_req_duration{endpoint:chat}': ['p99<15000'],  // P99 < 15s
    errors: ['rate<0.05'],                                // Error rate < 5%
  },
};

// Test queries (varied to simulate real usage)
const queries = [
  'What is the yield strength of Grade A?',
  'What is UNS S99901?',
  'What is the carbon content maximum?',
  'Compare Grade A and Grade B yield strength',
  'What is the chromium range?',
  'List all mechanical properties',
  'What heat treatment is required?',
  'What is the tensile strength for Grade X?',
  'What is the solution annealing temperature?',
  'How long should materials be held during annealing?',
];

export default function () {
  const query = queries[Math.floor(Math.random() * queries.length)];

  const payload = JSON.stringify({
    query: query,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { endpoint: 'chat' },
  };

  const response = http.post(
    __ENV.API_URL || 'http://localhost:3000/api/chat',
    payload,
    params
  );

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 15s': (r) => r.timings.duration < 15000,
    'has response field': (r) => JSON.parse(r.body).response !== undefined,
    'has sources': (r) => JSON.parse(r.body).sources !== undefined,
  });

  errorRate.add(!success);

  // Simulate user think time (reading response)
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}
