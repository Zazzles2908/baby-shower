/**
 * Baby Shower App - API Helper Utilities
 * Testing utilities for Supabase Edge Functions
 */

import { test as base } from '@playwright/test';

/**
 * API Configuration
 */
export const API_CONFIG = {
  baseUrl: 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1',
  anonKey: '', // Will be set from environment
  functions: {
    guestbook: 'guestbook',
    vote: 'vote',
    pool: 'pool',
    quiz: 'quiz',
    advice: 'advice'
  }
};

/**
 * Custom test fixtures for API testing
 */
export const test = base.extend({
  // API context with proper headers
  apiContext: async ({ use }, testInfo) => {
    const context = await testInfo.project.use.baseRequestOptions({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.anonKey}`,
        'apikey': API_CONFIG.anonKey
      }
    });
    
    await use(context);
  },
  
  // Helper for making API requests
  apiRequest: async ({ request }, testInfo) => {
    const makeRequest = async (endpoint, options = {}) => {
      const url = `${API_CONFIG.baseUrl}/${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.anonKey}`,
        'apikey': API_CONFIG.anonKey,
        ...options.headers
      };
      
      const response = await request[options.method || 'POST'](url, {
        headers,
        data: options.data || {},
        timeout: options.timeout || 30000
      });
      
      return response;
    };
    
    await use(makeRequest);
  }
});

/**
 * Guestbook API Helper
 */
export class GuestbookAPI {
  constructor(request) {
    this.request = request;
    this.endpoint = API_CONFIG.functions.guestbook;
  }
  
  async submitEntry(data) {
    const response = await this.request(this.endpoint, {
      method: 'POST',
      data: {
        name: data.name,
        message: data.message,
        relationship: data.relationship,
        testId: data.testId
      }
    });
    
    return this.parseResponse(response);
  }
  
  async getEntries() {
    const response = await this.request(`${this.endpoint}?action=list`, {
      method: 'GET'
    });
    
    return this.parseResponse(response);
  }
  
  parseResponse(response) {
    return {
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      body: response.ok() ? response.json() : null,
      error: response.ok() ? null : response.text(),
      success: response.ok()
    };
  }
}

/**
 * Vote API Helper
 */
export class VoteAPI {
  constructor(request) {
    this.request = request;
    this.endpoint = API_CONFIG.functions.vote;
  }
  
  async submitVote(data) {
    const response = await this.request(this.endpoint, {
      method: 'POST',
      data: {
        names: data.names,
        voteCount: data.voteCount,
        testId: data.testId
      }
    });
    
    return this.parseResponse(response);
  }
  
  async getVotes() {
    const response = await this.request(`${this.endpoint}?action=list`, {
      method: 'GET'
    });
    
    return this.parseResponse(response);
  }
  
  parseResponse(response) {
    return {
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      body: response.ok() ? response.json() : null,
      error: response.ok() ? null : response.text(),
      success: response.ok()
    };
  }
}

/**
 * Pool API Helper
 */
export class PoolAPI {
  constructor(request) {
    this.request = request;
    this.endpoint = API_CONFIG.functions.pool;
  }
  
  async submitPrediction(data) {
    const response = await this.request(this.endpoint, {
      method: 'POST',
      data: {
        name: data.name,
        prediction: data.prediction,
        dueDate: data.dueDate,
        testId: data.testId
      }
    });
    
    return this.parseResponse(response);
  }
  
  async getPredictions() {
    const response = await this.request(`${this.endpoint}?action=list`, {
      method: 'GET'
    });
    
    return this.parseResponse(response);
  }
  
  parseResponse(response) {
    return {
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      body: response.ok() ? response.json() : null,
      error: response.ok() ? null : response.text(),
      success: response.ok()
    };
  }
}

/**
 * Quiz API Helper
 */
export class QuizAPI {
  constructor(request) {
    this.request = request;
    this.endpoint = API_CONFIG.functions.quiz;
  }
  
  async submitAnswers(data) {
    const response = await this.request(this.endpoint, {
      method: 'POST',
      data: {
        answers: data.answers,
        score: data.score,
        totalQuestions: data.totalQuestions,
        testId: data.testId
      }
    });
    
    return this.parseResponse(response);
  }
  
  async getLeaderboard() {
    const response = await this.request(`${this.endpoint}?action=leaderboard`, {
      method: 'GET'
    });
    
    return this.parseResponse(response);
  }
  
  parseResponse(response) {
    return {
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      body: response.ok() ? response.json() : null,
      error: response.ok() ? null : response.text(),
      success: response.ok()
    };
  }
}

/**
 * Advice API Helper
 */
export class AdviceAPI {
  constructor(request) {
    this.request = request;
    this.endpoint = API_CONFIG.functions.advice;
  }
  
  async submitAdvice(data) {
    const response = await this.request(this.endpoint, {
      method: 'POST',
      data: {
        name: data.name,
        advice: data.advice,
        category: data.category,
        testId: data.testId
      }
    });
    
    return this.parseResponse(response);
  }
  
  async getAdvice() {
    const response = await this.request(`${this.endpoint}?action=list`, {
      method: 'GET'
    });
    
    return this.parseResponse(response);
  }
  
  parseResponse(response) {
    return {
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      body: response.ok() ? response.json() : null,
      error: response.ok() ? null : response.text(),
      success: response.ok()
    };
  }
}

/**
 * Create all API helpers for a test context
 */
export function createAPIHelpers(request) {
  return {
    guestbook: new GuestbookAPI(request),
    vote: new VoteAPI(request),
    pool: new PoolAPI(request),
    quiz: new QuizAPI(request),
    advice: new AdviceAPI(request)
  };
}

/**
 * Assert helpers for API responses
 */
export const assertions = {
  expectSuccess(response) {
    expect(response.success).toBe(true);
    expect(response.status).toBe(200);
  },
  
  expectError(response) {
    expect(response.success).toBe(false);
    expect(response.status).toBeGreaterThanOrEqual(400);
  },
  
  expectData(response, keys = []) {
    expect(response.body).toBeDefined();
    if (keys.length > 0) {
      keys.forEach(key => {
        expect(response.body).toHaveProperty(key);
      });
    }
  },
  
  expectTestIdInResponse(response, testId) {
    expect(response.body).toBeDefined();
    // Check if testId is present in the response data
    const data = JSON.stringify(response.body);
    expect(data).toContain(testId);
  }
};

export default {
  API_CONFIG,
  test,
  GuestbookAPI,
  VoteAPI,
  PoolAPI,
  QuizAPI,
  AdviceAPI,
  createAPIHelpers,
  assertions
};
