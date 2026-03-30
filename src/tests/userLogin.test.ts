/* import { HttpReturnObject } from '../invoiceInterface';
import { requestClear, requestUserLogin } from '../httpWrappers';

beforeEach(() => {
  requestClear();
});

describe('POST /v1/admin/auth/login', () => {
  describe('error cases', () => {
    test('UNAUTHORIZED - unregistered email address', () => {
      const res = requestUserLogin('notfound@email.com', 'password123');
      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({
        error: 'UNAUTHORIZED',
        message: expect.any(String)
      });
    });

    test('UNAUTHORIZED - incorrect password', () => {
      const user = requestUserRegister('test@email.com', 'password123', 'John Smith') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      expect(user.body).toStrictEqual({ session: expect.any(String) });

      const res = requestUserLogin('test@email.com', 'wrongpass');
      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({
        error: 'UNAUTHORIZED',
        message: expect.any(String)
      });
    });

    test('UNAUTHORIZED - password is case sensitive', () => {
      const user = requestUserRegister('case@email.com', 'Password123', 'Test User') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      expect(user.body).toStrictEqual({ session: expect.any(String) });

      const res = requestUserLogin('case@email.com', 'password123');
      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({
        error: 'UNAUTHORIZED',
        message: expect.any(String)
      });
    });

    test('UNAUTHORIZED - email is case sensitive', () => {
      const user = requestUserRegister('test@email.com', 'password123', 'Test User') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      expect(user.body).toStrictEqual({ session: expect.any(String) });

      const res = requestUserLogin('Test@email.com', 'password123');
      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({
        error: 'UNAUTHORIZED',
        message: expect.any(String)
      });
    });
  });

  describe('success cases', () => {
    test('successfully logs in user after registration', () => {
      const user = requestUserRegister('login@email.com', 'password123', 'John Smith') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      expect(user.body).toStrictEqual({ session: expect.any(String) });

      const res = requestUserLogin('login@email.com', 'password123');
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({ session: expect.any(String) });
    });

    test('can login multiple times with same credentials', () => {
      const user = requestUserRegister('multi@email.com', 'password123', 'Multi Login') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      expect(user.body).toStrictEqual({ session: expect.any(String) });

      const login1 = requestUserLogin('multi@email.com', 'password123');
      const login2 = requestUserLogin('multi@email.com', 'password123');

      expect(login1.statusCode).toStrictEqual(200);
      expect(login1.body).toStrictEqual({ session: expect.any(String) });
      expect(login2.statusCode).toStrictEqual(200);
      expect(login2.body).toStrictEqual({ session: expect.any(String) });
    });

    test('different users can login with correct credentials', () => {
      const user1 = requestUserRegister('user1@email.com', 'password123', 'User One') as HttpReturnObject<{ session: string }>;
      const user2 = requestUserRegister('user2@email.com', 'password456', 'User Two') as HttpReturnObject<{ session: string }>;

      expect(user1.statusCode).toStrictEqual(200);
      expect(user1.body).toStrictEqual({ session: expect.any(String) });
      expect(user2.statusCode).toStrictEqual(200);
      expect(user2.body).toStrictEqual({ session: expect.any(String) });

      const login1 = requestUserLogin('user1@email.com', 'password123');
      const login2 = requestUserLogin('user2@email.com', 'password456');

      expect(login1.statusCode).toStrictEqual(200);
      expect(login1.body).toStrictEqual({ session: expect.any(String) });
      expect(login2.statusCode).toStrictEqual(200);
      expect(login2.body).toStrictEqual({ session: expect.any(String) });
    });
  });
}); */
