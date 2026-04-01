import { HttpReturnObject } from '../invoiceInterface';
import { requestClear, requestUserRegister, requestUserDetails, requestUserDetailsUpdate } from '../httpWrappers';

beforeEach(() => {
  requestClear();
});

describe('PUT /v1/admin/user/details', () => {
  describe('error cases', () => {
    test('UNAUTHORIZED - empty session token', () => {
      const user = requestUserRegister('valid@email.com', 'Password123', 'John Doe') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);

      const res = requestUserDetailsUpdate('', 'test@email.com', 'John Smith');
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

      const res = requestUserDetailsUpdate(invalidSessionToken, 'test@email.com', 'John Smith');
      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({
        error: 'UNAUTHORIZED',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - not email format', () => {
      const user = requestUserRegister('test@email.com', 'password123', 'John Smith') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      const sessionToken = user.body.session;

      const res = requestUserDetailsUpdate(sessionToken, 'invalidemail', 'John Smith');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('CONFLICT - duplicate email used by another user', () => {
      const user1 = requestUserRegister('user1@email.com', 'password123', 'John Smith') as HttpReturnObject<{ session: string }>;
      expect(user1.statusCode).toStrictEqual(200);
      const sessionToken1 = user1.body.session;

      const user2 = requestUserRegister('user2@gmail.com', 'Xyz56789', 'Jane Doe');
      expect(user2.statusCode).toStrictEqual(200);

      const res = requestUserDetailsUpdate(sessionToken1, 'user2@gmail.com', 'John Smith');
      expect(res.statusCode).toStrictEqual(409);
      expect(res.body).toStrictEqual({
        error: 'CONFLICT',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - contains invalid characters', () => {
      const user = requestUserRegister('test@email.com', 'password123', 'John Smith') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      const sessionToken = user.body.session;

      const res = requestUserDetailsUpdate(sessionToken, 'test@email.com', 'J0hn Smith');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - contains invalid characters', () => {
      const user = requestUserRegister('last@email.com', 'password123', 'John Smith') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      const sessionToken = user.body.session;

      const res = requestUserDetailsUpdate(sessionToken, 'last@email.com', 'John Sm1th');
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });
  });

  describe('success cases', () => {
    test('successfully updates all details', () => {
      const user = requestUserRegister('update@email.com', 'password123', 'John Smith') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      const sessionToken = user.body.session;

      const res = requestUserDetailsUpdate(sessionToken, 'newemail@email.com', 'Jonathan Smithers');
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({});

      const details = requestUserDetails(sessionToken);
      expect(details.body.user).toStrictEqual({
        userId: expect.any(String),
        name: 'Jonathan Smithers',
        email: 'newemail@email.com'
      });
    });

    test('successfully updates only email address', () => {
      const user = requestUserRegister('update@email.com', 'password123', 'John Smith') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      const sessionToken = user.body.session;

      const res = requestUserDetailsUpdate(sessionToken, 'newemail@email.com', undefined);
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({});

      const details = requestUserDetails(sessionToken);
      expect(details.body.user).toStrictEqual({
        userId: expect.any(String),
        name: 'John Smith',
        email: 'newemail@email.com'
      });
    });

    test('successfully updates only name', () => {
      const user = requestUserRegister('update@email.com', 'password123', 'John Smith') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      const sessionToken = user.body.session;

      const res = requestUserDetailsUpdate(sessionToken, undefined, 'Jonathan Smithers');
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({});

      const details = requestUserDetails(sessionToken);
      expect(details.body.user).toStrictEqual({
        userId: expect.any(String),
        name: 'Jonathan Smithers',
        email: 'update@email.com'
      });
    });

    test('can update to same email (idempotent)', () => {
      const user = requestUserRegister('same@email.com', 'password123', 'John Smith') as HttpReturnObject<{ session: string }>;
      expect(user.statusCode).toStrictEqual(200);
      const sessionToken = user.body.session;

      const res = requestUserDetailsUpdate(sessionToken, 'same@email.com', 'Jonathan Smithers');
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({});

      const details = requestUserDetails(sessionToken);
      expect(details.body.user).toStrictEqual({
        userId: expect.any(String),
        name: 'Jonathan Smithers',
        email: 'same@email.com'
      });
    });
  });
});
