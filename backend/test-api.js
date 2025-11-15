

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => reject(error));

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testHealthCheck() {
  console.log('\n✅ Test 1: Health Check');
  try {
    const result = await makeRequest('GET', '/health');
    if (result.status === 200 && result.data.status === 'success') {
      console.log('   ✓ Health check passed');
      return true;
    } else {
      console.log('   ✗ Health check failed:', result);
      return false;
    }
  } catch (error) {
    console.log('   ✗ Health check error:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n✅ Test 2: Login');
  try {
    const result = await makeRequest('POST', '/auth/login', {
      email: 'admin@example.com',
      password: 'admin123',
    });

    if (result.status === 200 && result.data.data?.token) {
      authToken = result.data.data.token;
      console.log('   ✓ Login successful');
      console.log('   ✓ Token received');
      return true;
    } else {
      console.log('   ✗ Login failed:', result.data);
      return false;
    }
  } catch (error) {
    console.log('   ✗ Login error:', error.message);
    return false;
  }
}

async function testGetCurrentUser() {
  console.log('\n✅ Test 3: Get Current User (Protected Route)');
  try {
    const result = await makeRequest('GET', '/auth/me', null, authToken);

    if (result.status === 200 && result.data.data?.user) {
      console.log('   ✓ Protected route access successful');
      console.log(`   ✓ User: ${result.data.data.user.email}`);
      return true;
    } else {
      console.log('   ✗ Get current user failed:', result.data);
      return false;
    }
  } catch (error) {
    console.log('   ✗ Get current user error:', error.message);
    return false;
  }
}

async function testGetChannels() {
  console.log('\n✅ Test 4: Get Channels');
  try {
    const result = await makeRequest('GET', '/channels', null, authToken);

    if (result.status === 200 && result.data.data?.channels) {
      const channels = result.data.data.channels;
      console.log(`   ✓ Retrieved ${channels.length} channels`);
      return channels.length > 0 ? channels[0].id : null;
    } else {
      console.log('   ✗ Get channels failed:', result.data);
      return null;
    }
  } catch (error) {
    console.log('   ✗ Get channels error:', error.message);
    return null;
  }
}

async function testGetCategories() {
  console.log('\n✅ Test 5: Get Categories');
  try {
    const result = await makeRequest('GET', '/categories', null, authToken);

    if (result.status === 200 && result.data.data?.categories) {
      const categories = result.data.data.categories;
      console.log(`   ✓ Retrieved ${categories.length} categories`);
      return categories.length > 0 ? categories[0].id : null;
    } else {
      console.log('   ✗ Get categories failed:', result.data);
      return null;
    }
  } catch (error) {
    console.log('   ✗ Get categories error:', error.message);
    return null;
  }
}

async function testCreateQuery(channelId) {
  console.log('\n✅ Test 6: Create Query');
  try {
    const queryData = {
      channelId: channelId,
      subject: 'Test Query',
      content: 'This is a test query for API testing',
      senderName: 'Test User',
      senderEmail: 'test@example.com',
    };

    const result = await makeRequest('POST', '/queries', queryData, authToken);

    if (result.status === 201 && result.data.data?.query) {
      const query = result.data.data.query;
      console.log('   ✓ Query created successfully');
      console.log(`   ✓ Query ID: ${query.id}`);
      console.log(`   ✓ Priority: ${query.priority}`);
      console.log(`   ✓ Status: ${query.status}`);
      return query.id;
    } else {
      console.log('   ✗ Create query failed:', result.data);
      return null;
    }
  } catch (error) {
    console.log('   ✗ Create query error:', error.message);
    return null;
  }
}

async function testCreateQueryWithUrgency(channelId) {
  console.log('\n✅ Test 7: Create Query with Urgency Keywords (Priority Detection)');
  try {
    const queryData = {
      channelId: channelId,
      subject: 'URGENT: Service Issue',
      content: 'This is URGENT and CRITICAL! The service is broken and needs immediate attention!',
      senderName: 'VIP Customer',
      senderEmail: 'vip@example.com',
      isVip: true,
    };

    const result = await makeRequest('POST', '/queries', queryData, authToken);

    if (result.status === 201 && result.data.data?.query) {
      const query = result.data.data.query;
      console.log('   ✓ Urgent query created');
      console.log(`   ✓ Priority: ${query.priority} (should be HIGH)`);
      console.log(`   ✓ Is VIP: ${query.isVip}`);
      console.log(`   ✓ SLA Due At: ${query.slaDueAt}`);
      return query.priority === 'HIGH' || query.priority === 'CRITICAL';
    } else {
      console.log('   ✗ Create urgent query failed:', result.data);
      return false;
    }
  } catch (error) {
    console.log('   ✗ Create urgent query error:', error.message);
    return false;
  }
}

async function testGetQueries() {
  console.log('\n✅ Test 8: Get All Queries');
  try {
    const result = await makeRequest('GET', '/queries', null, authToken);

    if (result.status === 200 && result.data.data) {
      const queries = result.data.data.queries || [];
      const pagination = result.data.data.pagination || {};
      console.log(`   ✓ Retrieved ${queries.length} queries`);
      console.log(`   ✓ Total: ${pagination.total || 0}, Page: ${pagination.page || 1}`);
      return queries.length > 0;
    } else {
      console.log('   ✗ Get queries failed:', result.data);
      return false;
    }
  } catch (error) {
    console.log('   ✗ Get queries error:', error.message);
    return false;
  }
}

async function testCreateResponse(queryId) {
  console.log('\n✅ Test 9: Create Response');
  try {
    const responseData = {
      queryId: queryId,
      content: 'Thank you for your query. We are looking into this matter.',
      isInternal: false,
    };

    const result = await makeRequest('POST', '/responses', responseData, authToken);

    if (result.status === 201 && result.data.data?.response) {
      console.log('   ✓ Response created successfully');
      return true;
    } else {
      console.log('   ✗ Create response failed:', result.data);
      return false;
    }
  } catch (error) {
    console.log('   ✗ Create response error:', error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n✅ Test 10: Unauthorized Access Protection');
  try {
    const result = await makeRequest('GET', '/queries');

    if (result.status === 401) {
      console.log('   ✓ Unauthorized access correctly blocked');
      return true;
    } else {
      console.log('   ✗ Unauthorized access not blocked:', result.status);
      return false;
    }
  } catch (error) {
    console.log('   ✗ Unauthorized test error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Backend API Tests');
  console.log('================================\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  results.total++;
  if (await testHealthCheck()) results.passed++;
  else results.failed++;

  results.total++;
  if (await testLogin()) results.passed++;
  else results.failed++;

  results.total++;
  if (await testGetCurrentUser()) results.passed++;
  else results.failed++;

  results.total++;
  const channelId = await testGetChannels();
  if (channelId) results.passed++;
  else results.failed++;

  results.total++;
  await testGetCategories();
  results.passed++;

  results.total++;
  const queryId = await testCreateQuery(channelId);
  if (queryId) results.passed++;
  else results.failed++;

  results.total++;
  if (await testCreateQueryWithUrgency(channelId)) results.passed++;
  else results.failed++;

  results.total++;
  if (await testGetQueries()) results.passed++;
  else results.failed++;

  if (queryId) {
    results.total++;
    if (await testCreateResponse(queryId)) results.passed++;
    else results.failed++;
  }

  results.total++;
  if (await testUnauthorizedAccess()) results.passed++;
  else results.failed++;

  console.log('\n================================');
  console.log('📊 Test Results Summary');
  console.log('================================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('================================\n');

  if (results.failed === 0) {
    console.log('🎉 All tests passed! Backend is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
}

runTests().catch((error) => {
  console.error('\n❌ Test runner error:', error);
  process.exit(1);
});

