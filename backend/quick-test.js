// Quick test using Node.js built-in modules
const http = require('http');

console.log('🧪 Testing Notes-AI Backend...\n');

// Test health endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log('Testing health endpoint...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Health Check Success:', response);
      
      // Now test signup
      testSignup();
    } catch (error) {
      console.log('❌ Health Check Failed:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Connection Error:', error.message);
  console.log('\nIs the backend server running? Try: npm run dev');
});

req.end();

function testSignup() {
  console.log('\nTesting user signup...');
  
  const signupData = JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });
  
  const signupOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(signupData)
    }
  };
  
  const signupReq = http.request(signupOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (res.statusCode === 201) {
          console.log('✅ Signup Success:', {
            user: response.data.user.name,
            email: response.data.user.email,
            hasToken: !!response.data.token
          });
          console.log('\n🎉 Authentication is working perfectly!');
        } else if (res.statusCode === 400 && response.message.includes('already exists')) {
          console.log('⚠️  User already exists - that\'s fine!');
          console.log('✅ Authentication system is working!');
        } else {
          console.log('❌ Signup Failed:', response);
        }
      } catch (error) {
        console.log('❌ Signup Error:', error.message);
        console.log('Raw response:', data);
      }
    });
  });
  
  signupReq.on('error', (error) => {
    console.log('❌ Signup Request Error:', error.message);
  });
  
  signupReq.write(signupData);
  signupReq.end();
}
