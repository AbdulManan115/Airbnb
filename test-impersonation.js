/**
 * Test script for Host Impersonation API
 * 
 * This script tests the impersonation endpoints to verify they work correctly.
 * 
 * Usage:
 *   1. Make sure your server is running
 *   2. Update the SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD below
 *   3. Update the TEST_HOST_ID with a valid host ID from your database
 *   4. Run: node test-impersonation.js
 */

const BASE_URL = 'http://localhost:5001';

// CONFIGURATION - Update these values
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'admin@zuhahosts.com';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'admin123';
const TEST_HOST_ID = 'YOUR_HOST_ID_HERE'; // Replace with actual host ID

// Test state
let superadminToken = null;
let impersonationToken = null;

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

// Test 1: Login as superadmin
async function testSuperadminLogin() {
  console.log('\n📝 Test 1: Login as Superadmin');
  console.log('=' .repeat(50));
  
  const result = await apiCall('/api/auth/login', 'POST', {
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD
  });

  if (result.ok && result.data.token) {
    superadminToken = result.data.token;
    console.log('✅ PASS - Superadmin login successful');
    console.log('   Token:', superadminToken.substring(0, 20) + '...');
    return true;
  } else {
    console.log('❌ FAIL - Superadmin login failed');
    console.log('   Error:', result.data.error || 'Unknown error');
    return false;
  }
}

// Test 2: Get list of hosts
async function testGetHosts() {
  console.log('\n📝 Test 2: Get List of Hosts');
  console.log('=' .repeat(50));
  
  const result = await apiCall('/api/superadmin/hosts', 'GET', null, superadminToken);

  if (result.ok && result.data.hosts) {
    console.log('✅ PASS - Retrieved hosts list');
    console.log(`   Found ${result.data.count} hosts`);
    
    if (result.data.hosts.length > 0) {
      console.log('   First host:', result.data.hosts[0].name, '-', result.data.hosts[0].email);
      console.log('   Host ID:', result.data.hosts[0]._id || result.data.hosts[0].id);
    }
    return true;
  } else {
    console.log('❌ FAIL - Could not retrieve hosts');
    console.log('   Error:', result.data.error || 'Unknown error');
    return false;
  }
}

// Test 3: Impersonate a host
async function testImpersonateHost() {
  console.log('\n📝 Test 3: Impersonate Host');
  console.log('=' .repeat(50));
  
  if (TEST_HOST_ID === 'YOUR_HOST_ID_HERE') {
    console.log('⚠️  SKIP - Please update TEST_HOST_ID in the script');
    return false;
  }

  const result = await apiCall(
    `/api/superadmin/impersonate/${TEST_HOST_ID}`,
    'POST',
    null,
    superadminToken
  );

  if (result.ok && result.data.token) {
    impersonationToken = result.data.token;
    console.log('✅ PASS - Impersonation successful');
    console.log('   Impersonated user:', result.data.user.name);
    console.log('   Email:', result.data.user.email);
    console.log('   Impersonated by:', result.data.user.impersonatedBy);
    console.log('   New token:', impersonationToken.substring(0, 20) + '...');
    return true;
  } else {
    console.log('❌ FAIL - Impersonation failed');
    console.log('   Status:', result.status);
    console.log('   Error:', result.data.error || 'Unknown error');
    return false;
  }
}

// Test 4: Test impersonated session works
async function testImpersonatedSession() {
  console.log('\n📝 Test 4: Test Impersonated Session');
  console.log('=' .repeat(50));
  
  if (!impersonationToken) {
    console.log('⚠️  SKIP - No impersonation token available');
    return false;
  }

  const result = await apiCall('/api/bookings', 'GET', null, impersonationToken);

  if (result.ok) {
    console.log('✅ PASS - Impersonated session works');
    console.log('   Retrieved bookings as impersonated host');
    console.log('   Bookings count:', result.data.length || 0);
    return true;
  } else {
    console.log('❌ FAIL - Impersonated session failed');
    console.log('   Error:', result.data.error || 'Unknown error');
    return false;
  }
}

// Test 5: Stop impersonation
async function testStopImpersonation() {
  console.log('\n📝 Test 5: Stop Impersonation');
  console.log('=' .repeat(50));
  
  if (!impersonationToken) {
    console.log('⚠️  SKIP - No impersonation token available');
    return false;
  }

  const result = await apiCall(
    '/api/superadmin/stop-impersonation',
    'POST',
    null,
    impersonationToken
  );

  if (result.ok && result.data.token) {
    console.log('✅ PASS - Stop impersonation successful');
    console.log('   Returned to superadmin session');
    console.log('   User:', result.data.user.name);
    console.log('   Original token restored');
    return true;
  } else {
    console.log('❌ FAIL - Stop impersonation failed');
    console.log('   Error:', result.data.error || 'Unknown error');
    return false;
  }
}

// Test 6: Verify cannot impersonate with regular user token
async function testUnauthorizedImpersonation() {
  console.log('\n📝 Test 6: Test Unauthorized Impersonation (should fail)');
  console.log('=' .repeat(50));
  
  // Try to get a regular host token (this assumes you have a host in the system)
  // For this test, we'll just verify that a non-superadmin can't impersonate
  
  console.log('ℹ️  This test requires a non-superadmin user');
  console.log('   Skipping automated test - manual verification recommended');
  return true;
}

// Test 7: Verify cannot stop impersonation without impersonating
async function testStopWithoutImpersonation() {
  console.log('\n📝 Test 7: Test Stop Without Impersonation (should fail)');
  console.log('=' .repeat(50));
  
  const result = await apiCall(
    '/api/superadmin/stop-impersonation',
    'POST',
    null,
    superadminToken
  );

  if (!result.ok && result.status === 400) {
    console.log('✅ PASS - Correctly rejected stop impersonation');
    console.log('   Error message:', result.data.error);
    return true;
  } else {
    console.log('❌ FAIL - Should have rejected stop impersonation');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   HOST IMPERSONATION API - TEST SUITE         ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Superadmin Email: ${SUPERADMIN_EMAIL}`);
  console.log(`Test Host ID: ${TEST_HOST_ID}`);
  
  const results = [];
  
  // Run tests sequentially
  results.push(await testSuperadminLogin());
  
  if (superadminToken) {
    results.push(await testGetHosts());
    results.push(await testImpersonateHost());
    
    if (impersonationToken) {
      results.push(await testImpersonatedSession());
      results.push(await testStopImpersonation());
    }
    
    results.push(await testStopWithoutImpersonation());
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                 ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  const passed = results.filter(r => r === true).length;
  const total = results.length;
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed with error:');
  console.error(error);
  process.exit(1);
});

