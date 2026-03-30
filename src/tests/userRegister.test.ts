/* import { HttpReturnObject } from '../invoiceInterface';
import { requestUserRegister, requestClear } from '../httpWrappers';

beforeEach(() => {
  requestClear();
});

describe('POST /v1/admin/auth/register', () => {
  describe('error cases', () => {
    test('INVALID_REQUEST - not email format', () => {
      const res = requestUserRegister('invalidemail', 'abc12345', 'Alex Som');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('CONFLICT - duplicate email address', () => {
      const user = requestUserRegister('duplicate@gmail.com', 'abc12345', 'Jay Jones') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      expect(user.body).toStrictEqual({ session: expect.any(String) });

      const res = requestUserRegister('duplicate@gmail.com', 'different123', 'Alex Stone');
      expect(res.statusCode).toStrictEqual(409);
      expect(res.body).toStrictEqual({
        error: 'CONFLICT',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - contains invalid characters', () => {
      const res = requestUserRegister('fname@gmail.com', 'abc12345', 'Alex123 Brown');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - less than 8 characters', () => {
      const res = requestUserRegister('pass@gmail.com', 'short1', 'Alice Brown');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - only letters in password', () => {
      const res = requestUserRegister('pass2@gmail.com', 'password', 'Alice Brown');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - only numbers in password', () => {
      const res = requestUserRegister('pass3@gmail.com', '12345678', 'Alice Brown');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });
  });

  describe('success cases', () => {
    test('returns a session token on success', () => {
      const res = requestUserRegister('register@gmail.com', 'abc12345', 'Alex Som');
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({ session: expect.any(String) });
    });

    test('can register multiple users with different emails', () => {
      const user1 = requestUserRegister('user1@gmail.com', 'abc12345', 'John Doe') as HttpReturnObject<{ session: string }>;
      const user2 = requestUserRegister('user2@gmail.com', 'abc12345', 'Jane Doe') as HttpReturnObject<{ session: string }>;

      expect(user1.statusCode).toStrictEqual(200);
      expect(user2.statusCode).toStrictEqual(200);
      expect(user1.body).toStrictEqual({ session: expect.any(String) });
      expect(user2.body).toStrictEqual({ session: expect.any(String) });
    });

    test('accepts valid special characters in names', () => {
      const res = requestUserRegister('special@gmail.com', 'abc12345', 'Anne-Marie O\'Connor');
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({ session: expect.any(String) });
    });

    test('handles boundary values - minimum length names', () => {
      const res = requestUserRegister('min@gmail.com', 'abc12345', 'Jo Li');
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({ session: expect.any(String) });
    });

    test('handles boundary value - minimum password length', () => {
      const res = requestUserRegister('pass@gmail.com', 'pass1234', 'Test User');
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({ session: expect.any(String) });
    });
  });
});
*/
