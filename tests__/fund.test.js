/**
 * اختبارات A.E.C Sovereign Fund API
 */

const request = require('supertest');
const app = require('../app');

describe('A.E.C Sovereign Fund API', () => {
  test('GET /api/health should return 200 OK', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('app', 'A.E.C Sovereign Fund');
  });

  test('GET /api/apps should return app info', async () => {
    const response = await request(app).get('/api/apps');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 'aec-fund');
    expect(response.body).toHaveProperty('status', 'ONLINE');
  });

  test('GET /api/status should return operational status', async () => {
    const response = await request(app).get('/api/status');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OPERATIONAL');
  });

  test('GET / should return welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', '🦅 A.E.C Sovereign Fund API is running');
  });
});