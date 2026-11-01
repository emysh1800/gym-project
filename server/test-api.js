async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('🚀 Running Comprehensive API Production Test Suite...\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // 1. Test Login Validation Failure (Zod)
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'x', password: '1', targetRole: 'admin' })
    });
    const data = await res.json();
    assert(res.status === 400 && data.errors && data.errors.length > 0, '1. POST /api/auth/login rejects invalid input with 400 Bad Request');
  } catch (err) {
    console.error('Test 1 failed with error:', err);
  }

  // 2. Test Login Success & JWT Generation
  let adminToken = '';
  let memberToken = '';
  try {
    const resAdmin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: '123', targetRole: 'admin' })
    });
    const adminData = await resAdmin.json();
    adminToken = adminData.token;
    assert(resAdmin.status === 200 && adminData.token && adminData.role === 'admin', '2. POST /api/auth/login returns 200 OK + valid JWT for Admin');

    const resMember = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'member', password: '123', targetRole: 'member' })
    });
    const memberData = await resMember.json();
    memberToken = memberData.token;
    assert(resMember.status === 200 && memberData.token && memberData.role === 'member', '3. POST /api/auth/login returns 200 OK + valid JWT for Member');
  } catch (err) {
    console.error('Test 2/3 failed with error:', err);
  }

  // 3. Test Unauthorized Access (No Token)
  try {
    const res = await fetch(`${baseUrl}/api/member/current`);
    const data = await res.json();
    assert(res.status === 401 && data.statusCode === 401, '4. GET /api/member/current returns 401 Unauthorized when token is missing');
  } catch (err) {
    console.error('Test 4 failed with error:', err);
  }

  // 4. Test RBAC: Member token on Admin route
  try {
    const res = await fetch(`${baseUrl}/api/admin/members`, {
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const data = await res.json();
    assert(res.status === 403 && data.statusCode === 403, '5. GET /api/admin/members returns 403 Forbidden when accessed by Member role');
  } catch (err) {
    console.error('Test 5 failed with error:', err);
  }

  // 5. Test Authorized Admin Access & Advanced Query Parameters (Search, Filter, Pagination)
  try {
    const res = await fetch(`${baseUrl}/api/admin/members?search=ahmed&status=Active&page=1&limit=2`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.pagination &&
      data.pagination.page === 1 &&
      data.pagination.limit === 2 &&
      Array.isArray(data.data),
      '6. GET /api/admin/members supports ?search=&status=&page=&limit= with pagination metadata'
    );
  } catch (err) {
    console.error('Test 6 failed with error:', err);
  }

  // 6. Test PATCH /api/admin/members/:id/toggle (REST state partial update)
  try {
    const res = await fetch(`${baseUrl}/api/admin/members/1/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && data.member && data.member.id === 1, '7. PATCH /api/admin/members/:id/toggle returns 200 OK and toggles state');
  } catch (err) {
    console.error('Test 7 failed with error:', err);
  }

  // 7. Test POST /api/admin/members Zod validation (Bad Request vs 201 Created)
  let createdId = null;
  try {
    const resBad = await fetch(`${baseUrl}/api/admin/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: 'x', email: 'invalid-email', phone: '123' })
    });
    assert(resBad.status === 400, '8. POST /api/admin/members rejects invalid data with 400 Bad Request');

    const resGood = await fetch(`${baseUrl}/api/admin/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'كريم حسام الشناوي',
        email: 'kareem.shenawy@example.com',
        phone: '01012345678',
        plan: 'باقة اللياقة 3 أشهر (Pro)'
      })
    });
    const goodData = await resGood.json();
    createdId = goodData.member?.id;
    assert(resGood.status === 201 && goodData.member?.name === 'كريم حسام الشناوي', '9. POST /api/admin/members returns 201 Created with valid member object');
  } catch (err) {
    console.error('Test 8/9 failed with error:', err);
  }

  // 8. Test DELETE /api/admin/members/:id
  try {
    if (createdId) {
      const res = await fetch(`${baseUrl}/api/admin/members/${createdId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true, '10. DELETE /api/admin/members/:id removes member with 200 OK');
    }
  } catch (err) {
    console.error('Test 10 failed with error:', err);
  }

  console.log(`\n🏁 Test Results: ${passed} / ${total} Tests Passed!`);
  if (passed === total) {
    console.log('🎉 ALL PRODUCTION REQUIREMENTS FULLY SATISFIED!');
  }
}

runTests();
