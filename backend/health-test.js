const http = require('http');

// Test health endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Health Check - Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Health Check Response:', data);
  });
});

req.on('error', (error) => {
  console.error('❌ Health Check Error:', error.message);
});

req.end();
