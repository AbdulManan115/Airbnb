/**
 * Test Permissions API
 * 
 * This script tests the permissions CRUD endpoints
 * Make sure your server is running before executing this script
 * 
 * Usage:
 *   1. Start server: npm start
 *   2. Login and get a token
 *   3. Set TOKEN environment variable
 *   4. Run: TOKEN=your_token node test-permissions.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error('❌ Error: TOKEN environment variable is required');
  console.log('\nUsage:');
  console.log('  TOKEN=your_jwt_token node test-permissions.js');
  console.log('\nTo get a token:');
  console.log('  1. Start the server: npm start');
  console.log('  2. Login via POST /api/auth/login');
  console.log('  3. Copy the token from the response');
  process.exit(1);
}

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Test data
const testPermission = {
  name: 'test-analytics',
  sub_permissions: [
    {
      name: 'Dashboard',
      sub_permissions: [
        { name: 'View Dashboard', sub_permissions: null },
        { name: 'Export Data', sub_permissions: null }
      ]
    },
    {
      name: 'Reports',
      sub_permissions: [
        { name: 'Generate Report', sub_permissions: null },
        { name: 'Schedule Report', sub_permissions: null }
      ]
    }
  ]
};

let createdPermissionId = null;

// Helper function to display results
function displayResult(testName, success, data, error = null) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test: ${testName}`);
  console.log(`${'='.repeat(60)}`);
  
  if (success) {
    console.log('✅ Status: PASSED');
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('❌ Status: FAILED');
    console.log('\nError:');
    console.log(error?.response?.data || error?.message || error);
  }
}

// Test functions
async function test1_GetAllPermissions() {
  try {
    const response = await api.get('/permissions');
    displayResult(
      'GET All Permissions',
      true,
      {
        status: response.data.status,
        count: response.data.data?.length || 0,
        sample: response.data.data?.[0]?.name || 'No permissions found'
      }
    );
    return true;
  } catch (error) {
    displayResult('GET All Permissions', false, null, error);
    return false;
  }
}

async function test2_CreatePermission() {
  try {
    const response = await api.post('/permissions', testPermission);
    createdPermissionId = response.data.data._id;
    displayResult(
      'POST Create Permission',
      true,
      {
        status: response.data.status,
        message: response.data.message,
        id: createdPermissionId,
        name: response.data.data.name,
        sub_permissions_count: response.data.data.sub_permissions?.length || 0
      }
    );
    return true;
  } catch (error) {
    displayResult('POST Create Permission', false, null, error);
    return false;
  }
}

async function test3_GetPermissionById() {
  if (!createdPermissionId) {
    console.log('\n⚠️  Skipping: No permission ID available');
    return false;
  }

  try {
    const response = await api.get(`/permissions/${createdPermissionId}`);
    displayResult(
      'GET Permission by ID',
      true,
      {
        status: response.data.status,
        id: response.data.data._id,
        name: response.data.data.name,
        sub_permissions: response.data.data.sub_permissions
      }
    );
    return true;
  } catch (error) {
    displayResult('GET Permission by ID', false, null, error);
    return false;
  }
}

async function test4_UpdatePermission() {
  if (!createdPermissionId) {
    console.log('\n⚠️  Skipping: No permission ID available');
    return false;
  }

  try {
    const updateData = {
      name: 'updated-test-analytics',
      sub_permissions: [
        {
          name: 'Dashboard',
          sub_permissions: [
            { name: 'View Dashboard', sub_permissions: null },
            { name: 'Export Data', sub_permissions: null },
            { name: 'Share Dashboard', sub_permissions: null }
          ]
        }
      ]
    };

    const response = await api.put(`/permissions/${createdPermissionId}`, updateData);
    displayResult(
      'PUT Update Permission',
      true,
      {
        status: response.data.status,
        message: response.data.message,
        id: response.data.data._id,
        name: response.data.data.name,
        sub_permissions_count: response.data.data.sub_permissions?.length || 0
      }
    );
    return true;
  } catch (error) {
    displayResult('PUT Update Permission', false, null, error);
    return false;
  }
}

async function test5_AddSubPermission() {
  if (!createdPermissionId) {
    console.log('\n⚠️  Skipping: No permission ID available');
    return false;
  }

  try {
    const subPermissionData = {
      path: [0],
      sub_permission: {
        name: 'Customize Dashboard',
        sub_permissions: null
      }
    };

    const response = await api.post(
      `/permissions/${createdPermissionId}/sub-permission`,
      subPermissionData
    );
    displayResult(
      'POST Add Sub-Permission',
      true,
      {
        status: response.data.status,
        message: response.data.message,
        id: response.data.data._id,
        name: response.data.data.name,
        sub_permissions: response.data.data.sub_permissions
      }
    );
    return true;
  } catch (error) {
    displayResult('POST Add Sub-Permission', false, null, error);
    return false;
  }
}

async function test6_DeletePermission() {
  if (!createdPermissionId) {
    console.log('\n⚠️  Skipping: No permission ID available');
    return false;
  }

  try {
    const response = await api.delete(`/permissions/${createdPermissionId}`);
    displayResult(
      'DELETE Permission',
      true,
      {
        status: response.data.status,
        message: response.data.message,
        deleted_id: response.data.data._id,
        deleted_name: response.data.data.name
      }
    );
    return true;
  } catch (error) {
    displayResult('DELETE Permission', false, null, error);
    return false;
  }
}

async function test7_ValidationErrors() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Test: Validation Errors');
  console.log(`${'='.repeat(60)}`);

  const tests = [
    {
      name: 'Missing name',
      data: { sub_permissions: [] },
      expectedError: 'Name is required'
    },
    {
      name: 'Invalid sub_permissions type',
      data: { name: 'test', sub_permissions: 'invalid' },
      expectedError: 'sub_permissions must be an array'
    },
    {
      name: 'Name too short',
      data: { name: 'a', sub_permissions: [] },
      expectedError: 'Name must be between 2 and 100 characters'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await api.post('/permissions', test.data);
      console.log(`\n  ❌ ${test.name}: Expected error but succeeded`);
      failed++;
    } catch (error) {
      const errorMsg = error.response?.data?.error || '';
      if (errorMsg.includes(test.expectedError.split(' ')[0])) {
        console.log(`\n  ✅ ${test.name}: Got expected error`);
        console.log(`     Error: ${errorMsg}`);
        passed++;
      } else {
        console.log(`\n  ❌ ${test.name}: Got unexpected error`);
        console.log(`     Expected: ${test.expectedError}`);
        console.log(`     Got: ${errorMsg}`);
        failed++;
      }
    }
  }

  console.log(`\n  Summary: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run all tests
async function runAllTests() {
  console.log('\n🧪 Starting Permissions API Tests...');
  console.log(`API URL: ${API_URL}`);
  console.log(`Token: ${TOKEN.substring(0, 20)}...`);

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    { name: 'Get All Permissions', fn: test1_GetAllPermissions },
    { name: 'Create Permission', fn: test2_CreatePermission },
    { name: 'Get Permission by ID', fn: test3_GetPermissionById },
    { name: 'Update Permission', fn: test4_UpdatePermission },
    { name: 'Add Sub-Permission', fn: test5_AddSubPermission },
    { name: 'Delete Permission', fn: test6_DeletePermission },
    { name: 'Validation Errors', fn: test7_ValidationErrors }
  ];

  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the output above.');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error running tests:', error.message);
  process.exit(1);
});

