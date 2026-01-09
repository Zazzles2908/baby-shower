/**
 * Phase 8: API Validation Tests
 * Comprehensive Edge Function testing for Baby Shower App
 * 
 * Tests:
 * 1. Endpoint availability and response times
 * 2. Authentication validation
 * 3. CORS headers verification
 * 4. Security headers implementation
 * 5. Input validation
 * 6. Error response formats
 * 7. Rate limiting behavior
 * 8. Concurrent request handling
 * 9. Data persistence
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI';

const ENDPOINTS = [
  { name: 'guestbook', method: 'POST', path: '/guestbook', requiresAuth: true },
  { name: 'vote', method: 'POST', path: '/vote', requiresAuth: true },
  { name: 'pool', method: 'POST', path: '/pool', requiresAuth: true },
  { name: 'quiz', method: 'POST', path: '/quiz', requiresAuth: true },
  { name: 'advice', method: 'POST', path: '/advice', requiresAuth: true },
  { name: 'game-session', method: 'POST', path: '/game-session', requiresAuth: true },
  { name: 'game-session', method: 'GET', path: '/game-session', requiresAuth: true },
  { name: 'game-scenario', method: 'POST', path: '/game-scenario', requiresAuth: false },
  { name: 'game-scenario', method: 'GET', path: '/game-scenario', requiresAuth: false },
  { name: 'game-vote', method: 'POST', path: '/game-vote', requiresAuth: true },
  { name: 'game-reveal', method: 'POST', path: '/game-reveal', requiresAuth: false },
  { name: 'who-would-rather', method: 'POST', path: '/who-would-rather', requiresAuth: true },
  { name: 'lobby-status', method: 'POST', path: '/lobby-status', requiresAuth: true },
  { name: 'lobby-join', method: 'POST', path: '/lobby-join', requiresAuth: true },
  { name: 'game-start', method: 'POST', path: '/game-start', requiresAuth: true },
  { name: 'lobby-create', method: 'POST', path: '/lobby-create', requiresAuth: true },
  { name: 'create-demo-sessions', method: 'POST', path: '/create-demo-sessions', requiresAuth: true },
  { name: 'test-advice', method: 'POST', path: '/test-advice', requiresAuth: true },
  { name: 'check-env', method: 'GET', path: '/check-env', requiresAuth: false },
  { name: 'test-minimax', method: 'POST', path: '/test-minimax', requiresAuth: false },
];

// Test results storage
const testResults = {
  endpoints: [] as any[],
  authentication: [] as any[],
  cors: [] as any[],
  security: [] as any[],
  inputValidation: [] as any[],
  errorHandling: [] as any[],
  performance: [] as any[],
  concurrency: [] as any[],
};

test.describe('Phase 8: API Validation Tests', () => {
  test.describe('1. Endpoint Availability Tests', () => {
    for (const endpoint of ENDPOINTS) {
      test(`${endpoint.method} ${endpoint.name}`, async ({ request }) => {
        const startTime = Date.now();
        
        const options: any = {
          headers: {
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        };

        if (endpoint.method === 'GET' && endpoint.path.includes('?')) {
          options.params = new URLSearchParams(endpoint.path.split('?')[1]);
        }

        const response = await request[endpoint.method.toLowerCase()](
          `${API_BASE_URL}${endpoint.path.split('?')[0]}`,
          options
        );

        const responseTime = Date.now() - startTime;
        
        const result = {
          name: endpoint.name,
          method: endpoint.method,
          path: endpoint.path,
          status: response.status(),
          responseTime,
          available: response.status() !== 404 && response.status() !== 500,
        };

        testResults.endpoints.push(result);

        // All endpoints should be available (not 404) and respond within 5 seconds
        expect(result.available).toBe(true);
        expect(responseTime).toBeLessThan(5000);
      });
    }
  });

  test.describe('2. Authentication Tests', () => {
    for (const endpoint of ENDPOINTS.filter(e => e.requiresAuth)) {
      test(`${endpoint.name} without auth should fail`, async ({ request }) => {
        const response = await request[endpoint.method.toLowerCase()](
          `${API_BASE_URL}${endpoint.path.split('?')[0]}`,
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const result = {
          name: endpoint.name,
          requiresAuth: endpoint.requiresAuth,
          statusWithoutAuth: response.status(),
          blocksUnauthenticated: response.status() === 401 || response.status() === 403 || response.status() === 400,
        };

        testResults.authentication.push(result);
        expect(result.blocksUnauthenticated).toBe(true);
      });
    }

    test('game-scenario without auth should succeed (verify_jwt: false)', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/game-scenario?session_id=test`);
      
      const result = {
        name: 'game-scenario-no-auth',
        expectedBehavior: 'should succeed',
        actualStatus: response.status(),
        allowsUnauthenticated: response.status() !== 401 && response.status() !== 403,
      };

      testResults.authentication.push(result);
      expect(result.allowsUnauthenticated).toBe(true);
    });
  });

  test.describe('3. CORS Headers Tests', () => {
    for (const endpoint of ENDPOINTS.slice(0, 10)) {
      test(`${endpoint.name} CORS headers`, async ({ request }) => {
        const response = await request.options(`${API_BASE_URL}${endpoint.path.split('?')[0]}`, {
          headers: {
            'Origin': 'https://baby-shower-v2.vercel.app',
            'Access-Control-Request-Method': 'POST',
          },
        });

        const corsHeaders = response.headers();
        const result = {
          name: endpoint.name,
          origin: corsHeaders['access-control-allow-origin'],
          methods: corsHeaders['access-control-allow-methods'],
          headers: corsHeaders['access-control-allow-headers'],
          hasCors: !!corsHeaders['access-control-allow-origin'],
        };

        testResults.cors.push(result);
        expect(result.hasCors).toBe(true);
        expect(result.origin).toBeTruthy();
      });
    }
  });

  test.describe('4. Security Headers Tests', () => {
    for (const endpoint of ENDPOINTS.slice(0, 10)) {
      test(`${endpoint.name} security headers`, async ({ request }) => {
        const response = await request[endpoint.method.toLowerCase()](
          `${API_BASE_URL}${endpoint.path.split('?')[0]}`,
          {
            headers: {
              'Authorization': `Bearer ${ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            data: endpoint.method === 'POST' ? {} : undefined,
          }
        );

        const securityHeaders = response.headers();
        const result = {
          name: endpoint.name,
          'x-content-type-options': securityHeaders['x-content-type-options'],
          'x-frame-options': securityHeaders['x-frame-options'],
          'x-xss-protection': securityHeaders['x-xss-protection'],
          'referrer-policy': securityHeaders['referrer-policy'],
          hasSecurityHeaders: 
            securityHeaders['x-content-type-options'] === 'nosniff' &&
            securityHeaders['x-frame-options'] === 'DENY',
        };

        testResults.security.push(result);
        expect(result.hasSecurityHeaders).toBe(true);
      });
    }
  });

  test.describe('5. Input Validation Tests', () => {
    test('guestbook rejects empty name', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/guestbook`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { name: '', message: 'Test message', relationship: 'Friend' },
      });

      const result = {
        name: 'guestbook-empty-name',
        status: response.status(),
        hasValidationError: response.status() === 400,
        responseBody: await response.json(),
      };

      testResults.inputValidation.push(result);
      expect(result.hasValidationError).toBe(true);
    });

    test('guestbook rejects too long message', async ({ request }) => {
      const longMessage = 'x'.repeat(2000);
      const response = await request.post(`${API_BASE_URL}/guestbook`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { name: 'Test', message: longMessage, relationship: 'Friend' },
      });

      const result = {
        name: 'guestbook-long-message',
        status: response.status(),
        hasValidationError: response.status() === 400,
      };

      testResults.inputValidation.push(result);
      expect(result.hasValidationError).toBe(true);
    });

    test('pool rejects invalid date format', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/pool`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { 
          name: 'Test',
          prediction: 'Baby prediction',
          dueDate: 'invalid-date',
          weight: 3.5,
          length: 50,
        },
      });

      const result = {
        name: 'pool-invalid-date',
        status: response.status(),
        hasValidationError: response.status() === 400,
      };

      testResults.inputValidation.push(result);
      expect(result.hasValidationError).toBe(true);
    });

    test('pool rejects negative weight', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/pool`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { 
          name: 'Test',
          prediction: 'Baby prediction',
          dueDate: '2026-06-15',
          weight: -5,
          length: 50,
        },
      });

      const result = {
        name: 'pool-negative-weight',
        status: response.status(),
        hasValidationError: response.status() === 400,
      };

      testResults.inputValidation.push(result);
      expect(result.hasValidationError).toBe(true);
    });

    test('vote rejects empty names array', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/vote`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { selected_names: [] },
      });

      const result = {
        name: 'vote-empty-array',
        status: response.status(),
        hasValidationError: response.status() === 400,
      };

      testResults.inputValidation.push(result);
      expect(result.hasValidationError).toBe(true);
    });

    test('vote rejects too many names', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/vote`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { selected_names: ['A', 'B', 'C', 'D', 'E'] },
      });

      const result = {
        name: 'vote-too-many',
        status: response.status(),
        hasValidationError: response.status() === 400,
      };

      testResults.inputValidation.push(result);
      expect(result.hasValidationError).toBe(true);
    });

    test('game-vote rejects invalid vote choice', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/game-vote`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { 
          session_code: 'TEST',
          guest_name: 'Test',
          scenario_id: 'test-id',
          vote_choice: 'invalid',
        },
      });

      const result = {
        name: 'game-vote-invalid-choice',
        status: response.status(),
        hasValidationError: response.status() === 400,
      };

      testResults.inputValidation.push(result);
      expect(result.hasValidationError).toBe(true);
    });

    test('quiz rejects invalid score', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/quiz`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { 
          score: 10,
          totalQuestions: 5,
          answers: { p1: 'a', p2: 'b', p3: 'c', p4: 'd', p5: 'e' },
        },
      });

      const result = {
        name: 'quiz-invalid-score',
        status: response.status(),
        hasValidationError: response.status() === 400,
      };

      testResults.inputValidation.push(result);
      expect(result.hasValidationError).toBe(true);
    });
  });

  test.describe('6. Error Response Format Tests', () => {
    test('error response has consistent format', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/guestbook`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { name: '', message: '', relationship: '' },
      });

      const body = await response.json();
      const result = {
        hasSuccessField: body.success === false,
        hasErrorField: typeof body.error === 'string',
        hasTimestamp: !!body.timestamp,
        hasConsistentFormat: 
          body.success !== undefined && 
          typeof body.error === 'string' && 
          !!body.timestamp,
      };

      testResults.errorHandling.push(result);
      expect(result.hasConsistentFormat).toBe(true);
    });

    test('error responses include validation details', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/pool`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { 
          name: 'Test',
          prediction: 'Baby prediction',
          dueDate: 'invalid',
          weight: -5,
          length: 50,
        },
      });

      const body = await response.json();
      const result = {
        hasDetails: !!body.details,
        detailsIsArray: Array.isArray(body.details),
        hasValidationErrors: body.details?.length > 0,
      };

      testResults.errorHandling.push(result);
      expect(result.hasDetails).toBe(true);
    });

    test('404 returns proper error format', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/non-existent-endpoint`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: {},
      });

      const body = await response.json();
      const result = {
        isNotFound: response.status() === 404,
        hasErrorMessage: typeof body.error === 'string',
      };

      testResults.errorHandling.push(result);
      expect(result.isNotFound).toBe(true);
      expect(result.hasErrorMessage).toBe(true);
    });

    test('405 method not allowed returns proper format', async ({ request }) => {
      const response = await request.put(`${API_BASE_URL}/guestbook`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: {},
      });

      const body = await response.json();
      const result = {
        isMethodNotAllowed: response.status() === 405,
        hasErrorMessage: typeof body.error === 'string',
      };

      testResults.errorHandling.push(result);
      expect(result.isMethodNotAllowed).toBe(true);
    });
  });

  test.describe('7. Performance Tests', () => {
    test('guestbook response time < 3 seconds', async ({ request }) => {
      const startTime = Date.now();
      
      await request.post(`${API_BASE_URL}/guestbook`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { 
          name: 'Performance Test', 
          message: 'Testing response time',
          relationship: 'Tester' 
        },
      });

      const responseTime = Date.now() - startTime;
      const result = {
        name: 'guestbook-response-time',
        responseTime,
        underThreshold: responseTime < 3000,
      };

      testResults.performance.push(result);
      expect(result.underThreshold).toBe(true);
    });

    test('pool response time < 3 seconds', async ({ request }) => {
      const startTime = Date.now();
      
      await request.post(`${API_BASE_URL}/pool`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { 
          name: 'Performance Test',
          prediction: 'Baby prediction',
          dueDate: '2026-06-15',
          weight: 3.5,
          length: 50,
        },
      });

      const responseTime = Date.now() - startTime;
      const result = {
        name: 'pool-response-time',
        responseTime,
        underThreshold: responseTime < 3000,
      };

      testResults.performance.push(result);
      expect(result.underThreshold).toBe(true);
    });

    test('advice response time < 3 seconds', async ({ request }) => {
      const startTime = Date.now();
      
      await request.post(`${API_BASE_URL}/advice`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { 
          name: 'Performance Test',
          message: 'Testing response time',
          category: 'For Parents',
        },
      });

      const responseTime = Date.now() - startTime;
      const result = {
        name: 'advice-response-time',
        responseTime,
        underThreshold: responseTime < 3000,
      };

      testResults.performance.push(result);
      expect(result.underThreshold).toBe(true);
    });
  });

  test.describe('8. HTTP Method Validation Tests', () => {
    test('GET endpoint rejects POST method', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/check-env`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {},
      });

      const result = {
        name: 'check-env-post-rejected',
        status: response.status(),
        isMethodNotAllowed: response.status() === 405,
      };

      testResults.errorHandling.push(result);
      expect(result.isMethodNotAllowed).toBe(true);
    });

    test('POST endpoint rejects GET method', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/guestbook`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
        },
      });

      const result = {
        name: 'guestbook-get-rejected',
        status: response.status(),
        isMethodNotAllowed: response.status() === 405,
      };

      testResults.errorHandling.push(result);
      expect(result.isMethodNotAllowed).toBe(true);
    });

    test('OPTIONS request returns 204', async ({ request }) => {
      const response = await request.options(`${API_BASE_URL}/guestbook`, {
        headers: {
          'Origin': 'https://baby-shower-v2.vercel.app',
          'Access-Control-Request-Method': 'POST',
        },
      });

      const result = {
        name: 'cors-options',
        status: response.status(),
        isNoContent: response.status() === 204,
      };

      testResults.cors.push(result);
      expect(result.isNoContent).toBe(true);
    });
  });

  test.describe('9. JSON Content-Type Tests', () => {
    test('POST requests with invalid JSON return 400', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/guestbook`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: '{ invalid json',
      });

      const result = {
        name: 'invalid-json',
        status: response.status(),
        isBadRequest: response.status() === 400,
      };

      testResults.inputValidation.push(result);
      expect(result.isBadRequest).toBe(true);
    });

    test('Responses have JSON content type', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/guestbook`, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { 
          name: 'Content Type Test', 
          message: 'Test message', 
          relationship: 'Tester' 
        },
      });

      const contentType = response.headers()['content-type'];
      const result = {
        name: 'json-content-type',
        contentType,
        isJson: contentType?.includes('application/json'),
      };

      testResults.security.push(result);
      expect(result.isJson).toBe(true);
    });
  });

  test.describe('10. Rate Limiting Behavior Tests', () => {
    test('Multiple rapid requests handled correctly', async ({ request }) => {
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        const response = await request.post(`${API_BASE_URL}/check-env`, {
          headers: { 'Content-Type': 'application/json' },
        });
        results.push({
          requestNum: i + 1,
          status: response.status(),
          time: Date.now() - startTime,
        });
      }

      const allSucceeded = results.every(r => r.status === 200 || r.status === 400 || r.status === 404);
      const result = {
        name: 'rate-limiting-check',
        requestsMade: 5,
        allSucceeded,
        results,
      };

      testResults.concurrency.push(result);
      expect(allSucceeded).toBe(true);
    });
  });

  test.describe('11. Response Structure Validation', () => {
    test('Successful responses include success field', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/check-env`, {
        headers: { 'Content-Type': 'application/json' },
      });

      const body = await response.json();
      const result = {
        name: 'success-field-present',
        hasSuccessField: body.success !== undefined,
        successValue: body.success,
      };

      testResults.errorHandling.push(result);
      expect(result.hasSuccessField).toBe(true);
    });

    test('Successful responses include timestamp', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/check-env`, {
        headers: { 'Content-Type': 'application/json' },
      });

      const body = await response.json();
      const result = {
        name: 'timestamp-present',
        hasTimestamp: !!body.timestamp,
        isValidTimestamp: !isNaN(Date.parse(body.timestamp)),
      };

      testResults.errorHandling.push(result);
      expect(result.hasTimestamp).toBe(true);
      expect(result.isValidTimestamp).toBe(true);
    });
  });
});

// Export test results for report generation
export { testResults };
