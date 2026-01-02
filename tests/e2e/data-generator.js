/**
 * Baby Shower App - Test Data Generator
 * Generates consistent, unique test data for all activity types
 */

/**
 * Generate unique identifiers for test isolation
 */
export function generateUniqueId(prefix = 'test') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate unique guestbook test data
 */
export function generateGuestbookData(overrides = {}) {
  const uniqueId = generateUniqueId('guest');
  
  return {
    name: overrides.name || `Test Guest ${uniqueId}`,
    message: overrides.message || `Test message ${uniqueId}`,
    relationship: overrides.relationship || getRandomRelationship(),
    timestamp: new Date().toISOString(),
    testId: uniqueId
  };
}

/**
 * Generate unique voting test data
 */
export function generateVoteData(overrides = {}) {
  const uniqueId = generateUniqueId('vote');
  const names = [
    'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 
    'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'
  ];
  
  // Select random names for voting
  const voteCount = overrides.voteCount || Math.floor(Math.random() * 5) + 1;
  const selectedNames = names
    .sort(() => Math.random() - 0.5)
    .slice(0, voteCount);
  
  return {
    names: overrides.names || selectedNames,
    voteCount: selectedNames.length,
    timestamp: new Date().toISOString(),
    testId: uniqueId
  };
}

/**
 * Generate unique pool prediction test data
 */
export function generatePoolData(overrides = {}) {
  const uniqueId = generateUniqueId('pool');
  
  // Generate a future date between 30 and 90 days from now
  const daysFromNow = Math.floor(Math.random() * 60) + 30;
  const predictionDate = new Date();
  predictionDate.setDate(predictionDate.getDate() + daysFromNow);
  
  // Generate random time between 8 AM and 8 PM
  const hour = Math.floor(Math.random() * 12) + 8;
  const minute = Math.floor(Math.random() * 60);
  predictionDate.setHours(hour, minute, 0, 0);
  
  return {
    name: overrides.name || `Test Predictor ${uniqueId}`,
    prediction: overrides.prediction || predictionDate.toISOString(),
    dueDate: overrides.dueDate || predictionDate.toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    testId: uniqueId
  };
}

/**
 * Generate unique quiz test data
 */
export function generateQuizData(overrides = {}) {
  const uniqueId = generateUniqueId('quiz');
  const totalQuestions = 5;
  
  // Generate random answers (0-3 for each question)
  const answers = [];
  for (let i = 0; i < totalQuestions; i++) {
    answers.push(Math.floor(Math.random() * 4));
  }
  
  // Calculate score (assuming all answers are correct for positive testing)
  const score = overrides.score !== undefined ? overrides.score : answers.length;
  
  return {
    answers: overrides.answers || answers,
    score: score,
    totalQuestions: totalQuestions,
    timestamp: new Date().toISOString(),
    testId: uniqueId
  };
}

/**
 * Generate unique advice test data
 */
export function generateAdviceData(overrides = {}) {
  const uniqueId = generateUniqueId('advice');
  const categories = ['general', 'pregnancy', 'parenting', 'baby-care', 'work-life'];
  const adviceTemplates = [
    'Stay hydrated and get plenty of rest.',
    'Trust your instincts, you know your baby best.',
    'Take one day at a time and enjoy the journey.',
    'Accept help when it\'s offered.',
    'Sleep when the baby sleeps.',
    'Don\'t be afraid to ask for advice.',
    'Every baby is different, what works for one may not work for another.',
    'Capture all the precious moments.',
    'Self-care is important for new parents.',
    'Trust your healthcare providers.'
  ];
  
  return {
    name: overrides.name || `Test Advisor ${uniqueId}`,
    advice: overrides.advice || adviceTemplates[Math.floor(Math.random() * adviceTemplates.length)],
    category: overrides.category || categories[Math.floor(Math.random() * categories.length)],
    timestamp: new Date().toISOString(),
    testId: uniqueId
  };
}

/**
 * Generate complete test suite data
 */
export function generateAllTestData(overrides = {}) {
  return {
    guestbook: generateGuestbookData(overrides.guestbook),
    vote: generateVoteData(overrides.vote),
    pool: generatePoolData(overrides.pool),
    quiz: generateQuizData(overrides.quiz),
    advice: generateAdviceData(overrides.advice)
  };
}

/**
 * Generate invalid test data for error handling tests
 */
export function generateInvalidData() {
  return {
    guestbook: {
      // Missing required fields
      name: '',
      message: 'Test message'
    },
    vote: {
      // Empty names array
      names: [],
      voteCount: 0
    },
    pool: {
      // Past date (invalid)
      name: 'Test',
      prediction: '2020-01-01',
      dueDate: '2020-01-01'
    },
    quiz: {
      // Invalid answer format
      answers: 'invalid',
      score: 0,
      totalQuestions: 3
    },
    advice: {
      // Empty advice text
      name: 'Test',
      advice: '',
      category: 'invalid-category'
    }
  };
}

/**
 * Generate network error scenarios
 */
export function generateNetworkErrorScenarios() {
  return {
    timeout: {
      action: 'timeout',
      delay: 60000, // 60 second delay
      message: 'Request timeout'
    },
    serverError: {
      action: 'serverError',
      status: 500,
      message: 'Internal server error'
    },
    notFound: {
      action: 'notFound',
      status: 404,
      message: 'Function not found'
    },
    unauthorized: {
      action: 'unauthorized',
      status: 401,
      message: 'Unauthorized'
    }
  };
}

// Helper function to get random relationship
function getRandomRelationship() {
  const relationships = [
    'friend', 'family', 'colleague', 'neighbor', 
    'relative', 'classmate', 'other'
  ];
  return relationships[Math.floor(Math.random() * relationships.length)];
}

export default {
  generateUniqueId,
  generateGuestbookData,
  generateVoteData,
  generatePoolData,
  generateQuizData,
  generateAdviceData,
  generateAllTestData,
  generateInvalidData,
  generateNetworkErrorScenarios
};
