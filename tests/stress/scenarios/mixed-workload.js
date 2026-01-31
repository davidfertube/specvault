/**
 * Mixed Workload Stress Test
 *
 * Simulates realistic usage: 80% queries, 20% uploads.
 * Tests: System under realistic load with resource contention.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Test configuration with two scenarios
export const options = {
  scenarios: {
    upload_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 2 },  // 2 users uploading
        { duration: '4m', target: 3 },   // Ramp to 3 users
        { duration: '30s', target: 0 },  // Ramp down
      ],
      exec: 'uploadWorkload',
    },
    query_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 }, // 10 users querying
        { duration: '4m', target: 15 },  // Ramp to 15 users
        { duration: '30s', target: 0 },  // Ramp down
      ],
      exec: 'queryWorkload',
    },
  },
  thresholds: {
    'http_req_duration{endpoint:chat}': ['p95<10000'],
    'http_req_duration{endpoint:upload}': ['p95<60000'],
    errors: ['rate<0.05'],
  },
};

const queries = [
  'What is the yield strength?',
  'What is the carbon content?',
  'List mechanical properties',
  'Compare grades',
  'What is UNS designation?',
];

// Query workload (80% of traffic)
export function queryWorkload() {
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
    'query status is 200': (r) => r.status === 200,
    'query response time < 15s': (r) => r.timings.duration < 15000,
  });

  errorRate.add(!success);

  sleep(Math.random() * 2 + 3); // 3-5 seconds think time
}

// Upload workload (20% of traffic)
export function uploadWorkload() {
  const payload = JSON.stringify({
    documentId: `mixed-test-${Date.now()}`,
    path: './tests/stress/synthetic-pdfs/astm-a999-simple.pdf',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'upload' },
  };

  const response = http.post(
    __ENV.API_URL || 'http://localhost:3000/api/documents/upload',
    payload,
    params
  );

  const success = check(response, {
    'upload status is 200': (r) => r.status === 200,
    'upload response time < 60s': (r) => r.timings.duration < 60000,
  });

  errorRate.add(!success);

  sleep(Math.random() * 5 + 10); // 10-15 seconds between uploads
}
