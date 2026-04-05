import { HttpReturnObject } from '../invoiceInterface';
import { requestClear, requestUserRegister, requestUserPasswordUpdate, requestUserLogout } from '../httpWrappers';

beforeEach(() => {
  requestClear();
});

describe('POST /v1/admin/auth/logout', () => {
  describe('error cases', () => {
    test('UNAUTHORIZED - empty session token', () => {
      const user = requestUserRegister('valid@email.com', 'Password123', 'John Doe') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);

      const res = requestUserLogout('');
      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({
        error: 'UNAUTHORIZED',
        message: expect.any(String)
      });
    });

    test('UNAUTHORIZED - invalid session token', () => {
      const user = requestUserRegister('valid@email.com', 'Password123', 'John Doe') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      const invalidSessionToken = user.body.session + 'invalid_session';

      const res = requestUserLogout(invalidSessionToken);
      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({
        error: 'UNAUTHORIZED',
        message: expect.any(String)
      });
    });
  });

  describe('success cases', () => {
    test('logs out and invalidates session', () => {
      const user = requestUserRegister('valid@email.com', 'Password123', 'John Doe') as HttpReturnObject<{ session: string }>;
      const sessionToken = user.body.session;

      const res = requestUserLogout(sessionToken);
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({});

      const after = requestUserPasswordUpdate(sessionToken, 'Password123', 'NewPass1');
      expect(after.statusCode).toStrictEqual(401);
      expect(after.body).toStrictEqual({
        error: 'UNAUTHORIZED',
        message: expect.any(String)
      });
    });
  });
});
