const { spawn } = require('child_process');

async function runTests() {
  const TEST_PORT = 5002;
  console.log(`🚀 Starting MentorBridge Test Server on port ${TEST_PORT}...`);
  const proc = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(TEST_PORT) },
  });

  proc.stdout.on('data', (d) => {
    const str = d.toString();
    if (str.includes('MongoDB Connected') || str.includes('MentorBridge Server running')) {
      process.stdout.write('[server] ' + str);
    }
  });

  proc.stderr.on('data', (d) => {
    process.stderr.write('[server-err] ' + d.toString());
  });

  // Wait until server and database are ready
  const healthCheckUrl = `http://127.0.0.1:${TEST_PORT}/api/health`;
  let dbReady = false;
  for (let i = 0; i < 20; i++) {
    try {
      const hRes = await fetch(healthCheckUrl);
      const hData = await hRes.json();
      if (hData?.database?.readyState === 1) {
        dbReady = true;
        break;
      }
    } catch (_e) {}
    await new Promise((r) => setTimeout(r, 500));
  }

  const base = `http://127.0.0.1:${TEST_PORT}/api`;
  let passed = 0;
  let failed = 0;

  function assert(cond, name, extra = '') {
    if (cond) {
      console.log('✅ PASS:', name);
      passed++;
    } else {
      console.error('❌ FAIL:', name, extra);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('\n--- 1. Health Check ---');
    let res = await fetch(base + '/health');
    let data = await res.json();
    assert(
      res.status === 200 && data.status === 'OK' && data.database?.connected === true,
      'Health check returns 200, status OK, connected database',
      JSON.stringify(data)
    );

    // 2. Register valid senior user
    console.log('\n--- 2. Registration ---');
    const testEmail = `audit_${Date.now()}@college.edu`;
    res = await fetch(base + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Senior User',
        email: testEmail,
        password: 'validPassword123',
        role: 'senior',
        branch: 'CSE',
        graduationYear: 2026,
      }),
    });
    data = await res.json();
    assert(
      res.status === 201 && data.success && !!data.token && data.user.email === testEmail,
      'User registration returns 201, token, and user data',
      JSON.stringify(data)
    );
    const token = data.token;

    // 3. Duplicate email registration
    console.log('\n--- 3. Duplicate Email Protection ---');
    res = await fetch(base + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Audit',
        email: testEmail,
        password: 'validPassword123',
        role: 'junior',
      }),
    });
    data = await res.json();
    assert(
      res.status === 400 && data.error.includes('already registered'),
      'Duplicate registration rejected with 400',
      JSON.stringify(data)
    );

    // 4. Short password validation
    console.log('\n--- 4. Password Validation ---');
    res = await fetch(base + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pw',
        email: `short_${Date.now()}@college.edu`,
        password: '123',
        role: 'junior',
      }),
    });
    data = await res.json();
    assert(
      res.status === 400 && data.error.includes('at least 6 characters'),
      'Short password rejected with 400',
      JSON.stringify(data)
    );

    // 5. Valid Login
    console.log('\n--- 5. Valid Login ---');
    res = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'validPassword123',
      }),
    });
    data = await res.json();
    assert(
      res.status === 200 && data.success && !!data.token && data.user.name === 'Audit Senior User',
      'Login with valid credentials returns 200, JWT token, and user info',
      JSON.stringify(data)
    );

    // 6. Invalid password
    console.log('\n--- 6. Invalid Credentials Handling ---');
    res = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'wrongPassword!999',
      }),
    });
    data = await res.json();
    assert(
      res.status === 401 && data.error === 'Invalid email or password',
      'Incorrect password rejected with 401 and clean error message',
      JSON.stringify(data)
    );

    // 7. Non-existent email
    res = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `doesnotexist_${Date.now()}@college.edu`,
        password: 'somePassword123',
      }),
    });
    data = await res.json();
    assert(
      res.status === 401 && data.error === 'Invalid email or password',
      'Non-existent account rejected with 401',
      JSON.stringify(data)
    );

    // 8. Protected route /auth/me
    console.log('\n--- 7. Protected Routes & JWT Verification ---');
    res = await fetch(base + '/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    data = await res.json();
    assert(
      res.status === 200 && data.user.email === testEmail,
      'Protected route /auth/me verifies JWT and returns current user',
      JSON.stringify(data)
    );

    // 9. Unauthorized access without token
    res = await fetch(base + '/auth/me');
    data = await res.json();
    assert(
      res.status === 401 && data.error.includes('no token'),
      'Protected route without Bearer token blocked with 401',
      JSON.stringify(data)
    );

    // 10. Seniors Directory API
    console.log('\n--- 8. Feature APIs (Directory, Mentorship, Questions) ---');
    res = await fetch(base + '/users/seniors', {
      headers: { Authorization: `Bearer ${token}` },
    });
    data = await res.json();
    assert(
      res.status === 200 && Array.isArray(data.seniors) && data.seniors.length > 0,
      'Seniors directory returns list of active mentors',
      `Count: ${data.seniors?.length}`
    );

    // 11. Forum Questions API
    res = await fetch(base + '/questions', {
      headers: { Authorization: `Bearer ${token}` },
    });
    data = await res.json();
    assert(
      res.status === 200 && Array.isArray(data.questions),
      'Questions forum returns question list',
      `Count: ${data.questions?.length}`
    );

    // 12. Resources API
    res = await fetch(base + '/resources', {
      headers: { Authorization: `Bearer ${token}` },
    });
    data = await res.json();
    assert(
      res.status === 200 && Array.isArray(data.resources),
      'Resources library returns resource list',
      `Count: ${data.resources?.length}`
    );

    console.log('\n========================================');
    console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================');
  } catch (err) {
    console.error('Unhandled test suite failure:', err);
    failed++;
  } finally {
    proc.kill();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
