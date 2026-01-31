/**
 * Spike Test (DDoS Simulation)
 *
 * Sudden surge of 100 concurrent users to test system resilience.
 * Tests: Graceful degradation, rate limiting, error handling.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 5 },    // Normal load
    { duration: '10s', target: 100 }, // Sudden spike!
    { duration: '1m', target: 100 },  // Sustained spike
    { duration: '30s', target: 5 },   // Back to normal
  ],
  thresholds: {
    // More lenient thresholds during spike
    'http_req_duration': ['p95<20000'],  // P95 < 20s (degraded)
    errors: ['rate<0.5'],                 // Error rate < 50% during spike
  },
};

const queries = [
  'What is Grade A yield strength?',
  'What is UNS designation?',
  'List properties',
];

export default function () {
  const query = queries[Math.floor(Math.random() * queries.length)];

  const payload = JSON.stringify({ query });
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'chat' },
  };

  const response = http.post(
    __ENV.API_URL || 'http://localhost:3000/api/chat',
    payload,
    params
  );

  const success = check(response, {
    'status is not 500': (r) => r.status !== 500,  // Server shouldn't crash
    'response received': (r) => r.body.length > 0,
  });

  errorRate.add(!success);

  // Minimal think time during spike
  sleep(Math.random() * 0.5 + 0.5); // 0.5-1 second
}
