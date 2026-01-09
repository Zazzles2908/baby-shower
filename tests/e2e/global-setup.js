/**
 * Baby Shower App - Global Test Setup
 * Prepares the test environment before running tests
 */

import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';

async function globalSetup() {
  console.log('[Global Setup] Starting test environment preparation...');
  
  // Create test directories if they don't exist
  const testDirs = [
    './test-results',
    './test-results/html-report',
    './test-results/screenshots',
    './test-results/traces',
    './tests/e2e/.auth',
    './tests/e2e/fixtures',
    './tests/unit',
    './tests/integration',
    './tests/api',
    './tests/db',
    './tests/ai-mocks'
  ];
  
  for (const dir of testDirs) {
    const absPath = path.resolve(process.cwd(), dir);
    if (!existsSync(absPath)) {
      mkdirSync(absPath, { recursive: true });
      console.log(`[Global Setup] Created directory: ${dir}`);
    }
  }
  
  // Create test environment file if .env.local doesn't exist
  if (!existsSync('.env.local') && !existsSync('.env.local.example')) {
    console.log('[Global Setup] Warning: .env.local not found, creating example...');
    writeFileSync(
      '.env.local.example',
      `SUPABASE_URL=https://bkszmvfsfgvdwzacgmfz.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
MINIMAX_API_KEY=your_minimax_key_here
Z_AI_API_KEY=your_z_ai_key_here
KIMI_API_KEY=your_kimi_key_here
TEST_DATA_PREFIX=test_e2e_
USE_MOCKS=false
`
    );
  }
  
  // Create default auth state
  const authDir = path.resolve('tests/e2e/.auth');
  const authState = {
    cookies: [],
    origins: []
  };
  writeFileSync(
    path.join(authDir, 'state.json'),
    JSON.stringify(authState, null, 2)
  );
  
  // Pre-warm the browser
  console.log('[Global Setup] Pre-warming browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Check if local server is running
  try {
    await page.goto('http://localhost:3000', { timeout: 10000, waitUntil: 'domcontentloaded' });
    console.log('[Global Setup] Local server is running');
  } catch (error) {
    console.log('[Global Setup] Warning: Local server not running, tests will start it automatically');
  }
  
  await browser.close();
  
  // Generate initial test data
  console.log('[Global Setup] Generating test data fixtures...');
  generateTestFixtures();
  
  console.log('[Global Setup] ✅ Test environment ready!');
}

function generateTestFixtures() {
  const fixturesDir = path.resolve(process.cwd(), 'tests/e2e/fixtures');
  
  // Generate valid test data
  const validTestData = {
    guestbook: {
      valid: {
        name: 'Test Guest',
        relationship: 'friend',
        message: 'Test message for baby shower'
      },
      invalid: {
        emptyName: { name: '', relationship: 'friend', message: 'Test message' },
        emptyMessage: { name: 'Test Guest', relationship: 'friend', message: '' },
        tooShortMessage: { name: 'Test Guest', relationship: 'friend', message: 'Hi' },
        invalidRelationship: { name: 'Test Guest', relationship: 'invalid', message: 'Test' }
      }
    },
    pool: {
      valid: {
        name: 'Test Predictor',
        gender: 'surprise',
        birth_date: '2026-06-15',
        weight_kg: 3.5,
        length_cm: 50,
        favourite_colour: 'pink'
      },
      invalid: {
        pastDate: { name: 'Test', birth_date: '2020-01-01', weight_kg: 3.5, length_cm: 50 },
        invalidWeight: { name: 'Test', birth_date: '2026-06-15', weight_kg: 1.5, length_cm: 50 },
        invalidLength: { name: 'Test', birth_date: '2026-06-15', weight_kg: 3.5, length_cm: 35 }
      }
    },
    quiz: {
      valid: {
        participant_name: 'Test Participant',
        answers: {
          puzzle1: 'Baby Shower',
          puzzle2: 'Little Wolf',
          puzzle3: 'Good Night',
          puzzle4: 'Baby Care',
          puzzle5: 'Diapers'
        },
        score: 5,
        total_questions: 5
      },
      invalid: {
        emptyName: { answers: { puzzle1: 'Test' }, score: 0, total_questions: 1 },
        invalidScore: { participant_name: 'Test', answers: { puzzle1: 'Test' }, score: 10, total_questions: 5 }
      }
    },
    advice: {
      valid: {
        name: 'Test Advisor',
        advice: 'Stay hydrated and get plenty of rest during your pregnancy journey.',
        category: 'general'
      },
      invalid: {
        emptyName: { name: '', advice: 'Test advice', category: 'general' },
        emptyAdvice: { name: 'Test', advice: '', category: 'general' },
        invalidCategory: { name: 'Test', advice: 'Test', category: 'invalid' }
      }
    },
    vote: {
      valid: {
        vote_choice: 'mom',
        guest_name: 'Test Voter'
      },
      invalid: {
        emptyName: { vote_choice: 'mom', guest_name: '' },
        invalidChoice: { vote_choice: 'invalid', guest_name: 'Test' }
      }
    },
    game: {
      valid: {
        session_code: 'LOBBY-A',
        admin_code: '1111',
        player_name: 'Test Player'
      },
      invalid: {
        invalidSession: { session_code: 'INVALID', admin_code: '1111' }
      }
    }
  };
  
  writeFileSync(
    path.join(fixturesDir, 'valid-test-data.json'),
    JSON.stringify(validTestData, null, 2)
  );
  
  // Generate mock AI responses
  const mockAIRoasts = {
    pool: [
      'That prediction is... ambitious! Hope you have a crystal ball handy.',
      'Interesting choice! The baby might arrive fashionably late.',
      'Bold prediction! You\'re either psychic or very optimistic.',
      'That due date is exactly what the doctor ordered!',
      'A surprise gender? Keeping everyone guessing, I see!'
    ],
    advice: [
      'AI-generated wisdom: Parenting is 10% inspiration and 90% coffee.',
      'Roast mode: Your advice is almost as good as a good night\'s sleep.',
      'Wisdom from the digital oracle: Trust your gut, it\'s usually right.',
      'AI says: The days are long but the years are short. Enjoy every moment!'
    ],
    game: {
      scenarios: [
        { scenario: '3 AM diaper change', mom_option: 'Grumbling compliance', dad_option: 'Deep sleep' },
        { scenario: 'Baby\'s first smile', mom_option: 'Instant tears of joy', dad_option: 'Missing it entirely' }
      ],
      roasts: [
        'The crowd was way off! Someone hasn\'t changed a diaper before.',
        'Perception gap detected! You clearly don\'t know who you married.',
        'The majority ruled... and was completely wrong!'
      ]
    }
  };
  
  writeFileSync(
    path.join(fixturesDir, 'mock-ai-responses.json'),
    JSON.stringify(mockAIRoasts, null, 2)
  );
  
  console.log('[Global Setup] Test fixtures generated successfully');
}

export default globalSetup;
