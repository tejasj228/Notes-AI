const request = require('supertest');
const app = require('../server');

describe('Notes-AI Backend', () => {
  test('Health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  test('404 for unknown endpoint', async () => {
    const response = await request(app)
      .get('/api/unknown')
      .expect(404);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('API endpoint not found');
  });

  test('Authentication required for protected routes', async () => {
    const response = await request(app)
      .get('/api/notes')
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Access token');
  });
});

describe('Authentication', () => {
  test('Signup with valid data', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data.user.email).toBe(userData.email);
  });

  test('Signup fails with invalid email', async () => {
    const userData = {
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData)
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});
