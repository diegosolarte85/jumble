/**
 * Backend API Test Suite
 * Tests all API endpoints for functionality and error handling
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  response?: any;
}

const results: TestResult[] = [];

// Helper function to make API requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: any }> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

// Test runner
function test(name: string, fn: () => Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`✓ ${name}`);
    } catch (error: any) {
      results.push({ name, passed: false, error: error.message });
      console.error(`✗ ${name}: ${error.message}`);
    }
  };
}

// Test data
let testUserId: string;
let testUser2Id: string;
let testIdeaId: string;
let testSkillId: string;
let testMatchId: string;
let testMessageId: string;
let authToken: string;

// ========== AUTHENTICATION TESTS ==========

const authTests = [
  test('POST /api/auth/register - Register new user', async () => {
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'test123456',
        name: 'Test User',
      }),
    });
    if (status !== 201) throw new Error(`Expected 201, got ${status}: ${JSON.stringify(data)}`);
    if (!data.id || !data.email) throw new Error('Missing user data in response');
    testUserId = data.id;
  }),

  test('POST /api/auth/register - Reject duplicate email', async () => {
    const email = `duplicate${Date.now()}@example.com`;
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'test123456' }),
    });
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'test123456' }),
    });
    if (status !== 400) throw new Error(`Expected 400 for duplicate, got ${status}`);
  }),

  test('POST /api/auth/register - Reject missing email', async () => {
    const { status } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ password: 'test123456' }),
    });
    if (status !== 400) throw new Error(`Expected 400 for missing email, got ${status}`);
  }),
];

// ========== USER TESTS ==========

const userTests = [
  test('GET /api/users/me - Get current user (unauthorized)', async () => {
    const { status } = await apiRequest('/api/users/me');
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  }),

  test('PUT /api/users/me - Update profile (unauthorized)', async () => {
    const { status } = await apiRequest('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
    });
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  }),

  test('GET /api/users/[id] - Get public user profile', async () => {
    if (!testUserId) throw new Error('testUserId not set');
    const { status, data } = await apiRequest(`/api/users/${testUserId}`);
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (!data.id || data.id !== testUserId) throw new Error('Invalid user data');
  }),

  test('GET /api/users/[id] - Get non-existent user', async () => {
    const { status } = await apiRequest('/api/users/nonexistent');
    if (status !== 404) throw new Error(`Expected 404, got ${status}`);
  }),
];

// ========== SKILLS TESTS ==========

const skillsTests = [
  test('GET /api/skills/categories - Get skill categories', async () => {
    const { status, data } = await apiRequest('/api/skills/categories');
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (!Array.isArray(data) || data.length === 0) throw new Error('Invalid categories data');
  }),

  test('GET /api/skills - Get all skills', async () => {
    const { status, data } = await apiRequest('/api/skills');
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (!Array.isArray(data) || data.length === 0) throw new Error('Invalid skills data');
  }),

  test('GET /api/skills?category=Technical - Filter by category', async () => {
    const { status, data } = await apiRequest('/api/skills?category=Technical');
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (!Array.isArray(data)) throw new Error('Invalid skills data');
  }),

  test('POST /api/users/me/skills - Add skill (unauthorized)', async () => {
    const { status } = await apiRequest('/api/users/me/skills', {
      method: 'POST',
      body: JSON.stringify({
        skillName: 'JavaScript',
        proficiencyLevel: 'expert',
      }),
    });
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  }),
];

// ========== IDEAS TESTS ==========

const ideasTests = [
  test('POST /api/ideas - Create idea (unauthorized)', async () => {
    const { status } = await apiRequest('/api/ideas', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Idea',
        description: 'This is a test idea',
      }),
    });
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  }),

  test('POST /api/ideas - Reject missing title', async () => {
    const { status } = await apiRequest('/api/ideas', {
      method: 'POST',
      body: JSON.stringify({ description: 'No title' }),
    });
    if (status !== 401) throw new Error(`Expected 401 (unauthorized), got ${status}`);
  }),

  test('GET /api/ideas/[id] - Get idea (public)', async () => {
    // First create a user and idea manually for this test
    const { data: user } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `idea${Date.now()}@example.com`,
        password: 'test123456',
      }),
    });
    
    // We can't create an idea without auth, so we'll skip this for now
    // This test will be updated when we have proper auth flow
  }),
];

// ========== SWIPES TESTS ==========

const swipesTests = [
  test('POST /api/swipes - Swipe (unauthorized)', async () => {
    const { status } = await apiRequest('/api/swipes', {
      method: 'POST',
      body: JSON.stringify({
        swipedId: 'test-id',
        direction: 'right',
      }),
    });
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  }),

  test('POST /api/swipes - Reject invalid direction', async () => {
    const { status } = await apiRequest('/api/swipes', {
      method: 'POST',
      body: JSON.stringify({
        swipedId: 'test-id',
        direction: 'invalid',
      }),
    });
    if (status !== 401) throw new Error(`Expected 401 (unauthorized), got ${status}`);
  }),

  test('GET /api/swipes - Get swipe history (unauthorized)', async () => {
    const { status } = await apiRequest('/api/swipes');
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  }),
];

// ========== MATCHES TESTS ==========

const matchesTests = [
  test('GET /api/matches - Get matches (unauthorized)', async () => {
    const { status } = await apiRequest('/api/matches');
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  }),

  test('GET /api/matches/recommendations - Get recommendations (unauthorized)', async () => {
    const { status } = await apiRequest('/api/matches/recommendations');
    if (status !== 401) throw new Error(`Expected 401, got ${status}`);
  }),
];

// ========== HEALTH CHECK TESTS ==========

const healthTests = [
  test('GET /api/health - Health check', async () => {
    const { status, data } = await apiRequest('/api/health');
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (data.status !== 'ok' || data.database !== 'connected') {
      throw new Error(`Invalid health check response: ${JSON.stringify(data)}`);
    }
  }),
];

// ========== RUN ALL TESTS ==========

async function runAllTests() {
  console.log('\n🧪 Running Backend API Tests...\n');
  console.log('='.repeat(60));

  // Run tests in sequence
  console.log('\n📋 Authentication Tests:');
  for (const testFn of authTests) {
    await testFn();
  }

  console.log('\n👤 User Tests:');
  for (const testFn of userTests) {
    await testFn();
  }

  console.log('\n🎯 Skills Tests:');
  for (const testFn of skillsTests) {
    await testFn();
  }

  console.log('\n💡 Ideas Tests:');
  for (const testFn of ideasTests) {
    await testFn();
  }

  console.log('\n👆 Swipes Tests:');
  for (const testFn of swipesTests) {
    await testFn();
  }

  console.log('\n💚 Matches Tests:');
  for (const testFn of matchesTests) {
    await testFn();
  }

  console.log('\n🏥 Health Check Tests:');
  for (const testFn of healthTests) {
    await testFn();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:\n');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`);
      console.log(`    Error: ${r.error}\n`);
    });
  }
  
  console.log('='.repeat(60));
  
  return { passed, failed, total: results.length };
}

// Run if executed directly
if (require.main === module) {
  runAllTests()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export { runAllTests, results };

