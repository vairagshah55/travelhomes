const http = require('http');

const BASE_URL = 'http://localhost:3002';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing Auth APIs...\n');

  try {
    // Test 1: Register
    console.log('1️⃣  Testing Registration...');
    const registerData = {
      userType: 'user',
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      mobile: '9999999999',
      password: 'TestPass123',
      dateOfBirth: '1990-01-01',
      country: 'India',
      state: 'Maharashtra',
      city: 'Mumbai'
    };

    const registerRes = await makeRequest('POST', '/api/auth/register', registerData);
    console.log(`Status: ${registerRes.status}`);
    console.log(`Response:`, JSON.stringify(registerRes.body, null, 2));

    if (registerRes.body.registerId) {
      const registerId = registerRes.body.registerId;
      console.log(`✅ Registration successful! Register ID: ${registerId}\n`);

      // Test 2: Verify OTP
      console.log('2️⃣  Testing OTP Verification...');
      const otpData = { otp: registerRes.body.registered.otp };
      const otpRes = await makeRequest('POST', `/api/auth/register/${registerId}/verify-otp`, otpData);
      console.log(`Status: ${otpRes.status}`);
      console.log(`Response:`, JSON.stringify(otpRes.body, null, 2));

      if (otpRes.body.success) {
        console.log('✅ OTP verified!\n');

        // Test 3: Update Register Details
        console.log('3️⃣  Testing Update Register Details...');
        const updateData = {
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          country: 'India',
          state: 'Maharashtra',
          city: 'Mumbai'
        };
        const updateRes = await makeRequest('PATCH', `/api/auth/register/${registerId}`, updateData);
        console.log(`Status: ${updateRes.status}`);
        console.log(`Response:`, JSON.stringify(updateRes.body, null, 2));
        console.log('✅ Details updated!\n');
      }
    } else {
      console.log('❌ Registration failed!\n');
    }

    // Test 4: Login
    console.log('4️⃣  Testing Login...');
    const loginData = {
      email: 'testuser@example.com',
      password: 'TestPass123',
      userType: 'user'
    };

    const loginRes = await makeRequest('POST', '/api/vendorlogin/login', loginData);
    console.log(`Status: ${loginRes.status}`);
    console.log(`Response:`, JSON.stringify(loginRes.body, null, 2));

    if (loginRes.body.success) {
      console.log('✅ Login successful!\n');
      console.log(`Token: ${loginRes.body.token}`);
      console.log(`User:`, JSON.stringify(loginRes.body.user, null, 2));
    } else {
      console.log('❌ Login failed!\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
