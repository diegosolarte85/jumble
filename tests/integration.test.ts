/**
 * Integration Tests - Full User Flows
 * Tests complete workflows with authentication
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

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

function test(name: string, fn: () => Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`✓ ${name}`);
    } catch (error: any) {
      results.push({ name, passed: false, error: error.message, details: error });
      console.error(`✗ ${name}: ${error.message}`);
    }
  };
}

// Helper to get session cookie (simulating NextAuth session)
// Note: In a real scenario, we'd need to properly authenticate
// For now, we'll test endpoints that don't require auth or test auth flow

async function runIntegrationTests() {
  console.log('\n🔄 Running Integration Tests...\n');
  console.log('='.repeat(60));

  let user1Id: string;
  let user2Id: string;
  let idea1Id: string;
  let skill1Id: string;

  // Test 1: Complete user registration and profile flow
  await test('Complete User Registration Flow', async () => {
    const email = `user1${Date.now()}@example.com`;
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: 'password123',
        name: 'John Doe',
      }),
    });
    if (status !== 201) throw new Error(`Registration failed: ${status}`);
    if (!data.id) throw new Error('No user ID returned');
    user1Id = data.id;
  })();

  // Test 2: Get public user profile
  await test('Get Public User Profile After Registration', async () => {
    if (!user1Id) throw new Error('user1Id not set');
    const { status, data } = await apiRequest(`/api/users/${user1Id}`);
    if (status !== 200) throw new Error(`Failed to get user: ${status}`);
    if (data.id !== user1Id) throw new Error('User ID mismatch');
    if (data.email) throw new Error('Email should not be in public profile');
  })();

  // Test 3: Create second user for matching tests
  await test('Create Second User for Matching', async () => {
    const email = `user2${Date.now()}@example.com`;
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: 'password123',
        name: 'Jane Smith',
      }),
    });
    if (status !== 201) throw new Error(`Registration failed: ${status}`);
    user2Id = data.id;
  })();

  // Test 4: Test recommendations endpoint (should return users)
  await test('Get Match Recommendations (Basic)', async () => {
    // This endpoint requires auth, but we can test the structure
    // In real scenario, we'd authenticate first
    const { status } = await apiRequest('/api/matches/recommendations');
    // Should return 401 without auth, which is correct behavior
    if (status !== 401) {
      throw new Error(`Expected 401 without auth, got ${status}`);
    }
  })();

  // Test 5: Test skills taxonomy
  await test('Skills Taxonomy Structure', async () => {
    const { status, data } = await apiRequest('/api/skills');
    if (status !== 200) throw new Error(`Failed to get skills: ${status}`);
    if (!Array.isArray(data)) throw new Error('Skills should be an array');
    if (data.length === 0) throw new Error('No skills returned');
    
    // Check structure
    const firstCategory = data[0];
    if (!firstCategory.category || !firstCategory.skills) {
      throw new Error('Invalid skill category structure');
    }
    if (!Array.isArray(firstCategory.skills)) {
      throw new Error('Skills should be an array');
    }
  })();

  // Test 6: Test skill filtering
  await test('Filter Skills by Category', async () => {
    const { status, data } = await apiRequest('/api/skills?category=Technical');
    if (status !== 200) throw new Error(`Failed to filter skills: ${status}`);
    if (!Array.isArray(data)) throw new Error('Should return array');
    
    const technicalCategory = data.find((c: any) => c.category === 'Technical');
    if (!technicalCategory) throw new Error('Technical category not found');
  })();

  // Test 7: Test skill search
  await test('Search Skills', async () => {
    const { status, data } = await apiRequest('/api/skills?search=Development');
    if (status !== 200) throw new Error(`Failed to search skills: ${status}`);
    if (!Array.isArray(data)) throw new Error('Should return array');
  })();

  // Test 8: Test health endpoint
  await test('Health Check Returns Correct Status', async () => {
    const { status, data } = await apiRequest('/api/health');
    if (status !== 200) throw new Error(`Health check failed: ${status}`);
    if (data.status !== 'ok') throw new Error('Status should be ok');
    if (data.database !== 'connected') throw new Error('Database should be connected');
  })();

  // Test 9: Test error handling for invalid endpoints
  await test('404 for Invalid Endpoint', async () => {
    const { status } = await apiRequest('/api/nonexistent');
    if (status !== 404) throw new Error(`Expected 404, got ${status}`);
  })();

  // Test 10: Test validation errors
  await test('Validation Error Handling', async () => {
    // Test missing required fields
    const { status, data } = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (status !== 400) throw new Error(`Expected 400 for missing fields, got ${status}`);
    if (!data.error) throw new Error('Should return error message');
  })();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Integration Test Summary:\n');
  
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

if (require.main === module) {
  runIntegrationTests()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Integration test error:', error);
      process.exit(1);
    });
}

export { runIntegrationTests };

