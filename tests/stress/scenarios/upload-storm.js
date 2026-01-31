/**
 * Upload Storm Stress Test
 *
 * Simulates 5-10 concurrent users uploading PDFs.
 * Tests: File processing, embedding generation, database writes.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp to 5 concurrent users
    { duration: '1m', target: 5 },    // Stay at 5
    { duration: '30s', target: 10 },  // Ramp to 10
    { duration: '1m', target: 10 },   // Stay at 10
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration{endpoint:upload}': ['p95<60000'], // P95 < 60s
    errors: ['rate<0.1'],                                 // Error rate < 10%
  },
};

// Simulated PDF files (paths to synthetic PDFs)
const pdfFiles = [
  './tests/stress/synthetic-pdfs/astm-a999-simple.pdf',
  './tests/stress/synthetic-pdfs/astm-a998-medium.pdf',
  './tests/stress/synthetic-pdfs/astm-a997-complex.pdf',
];

export default function () {
  const pdfFile = pdfFiles[Math.floor(Math.random() * pdfFiles.length)];

  // Note: In real k6 test, you would need to use FormData or binary upload
  // This is a simplified version that shows the structure
  // For actual implementation, use k6's file upload capabilities

  const payload = {
    // In production, this would be a multipart/form-data upload
    // k6 supports file uploads via http.file()
    documentId: `test-doc-${Date.now()}`,
    path: pdfFile,
  };

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { endpoint: 'upload' },
  };

  // Step 1: Upload confirmation
  const uploadResponse = http.post(
    __ENV.API_URL || 'http://localhost:3000/api/documents/upload',
    JSON.stringify(payload),
    params
  );

  const uploadSuccess = check(uploadResponse, {
    'upload status is 200': (r) => r.status === 200,
    'has documentId': (r) => JSON.parse(r.body).documentId !== undefined,
  });

  if (!uploadSuccess) {
    errorRate.add(true);
    return;
  }

  const documentId = JSON.parse(uploadResponse.body).documentId;

  // Step 2: Trigger processing
  const processPayload = JSON.stringify({ documentId });
  const processResponse = http.post(
    __ENV.API_URL || 'http://localhost:3000/api/documents/process',
    processPayload,
    params
  );

  const processSuccess = check(processResponse, {
    'process status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    'response time < 90s': (r) => r.timings.duration < 90000,
  });

  errorRate.add(!processSuccess);

  // Simulate user wait time
  sleep(5);
}
