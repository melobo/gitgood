import { requestHealth } from '../httpWrappers';

describe('GET /v1/health', () => {
  test('returns 200 with status ok', () => {
    const res = requestHealth();

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(typeof res.body.timestamp).toBe('string');
  });
});
