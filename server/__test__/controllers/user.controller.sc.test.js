const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const Token = require('../../models/token.model');
const User = require('../../models/user.model');

const { logout } = require('../../controllers/user.controller');
const { refreshToken: refreshTokenFn } = require('../../controllers/user.controller');

jest.mock('../../models/token.model');
jest.mock('../../models/user.model')
describe('Security Test - POST /logout', () => {
  let token, expiredToken;

  beforeEach(() => {
    token = jwt.sign({ id: '66b27856aab40f9d60dc30c7' }, process.env.SECRET, { expiresIn: '1h' });
    expiredToken = jwt.sign({ id: '66b27856aab40f9d60dc30c7' }, process.env.SECRET, { expiresIn: '-1h' });

    req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should prevent reuse of invalidated tokens', async () => {
    Token.deleteOne.mockResolvedValue({ deletedCount: 1 });

    await logout(req, res, next);

    const protectedRouteResponse = await request(app)
      .get('/admin/logs')
      .set('Authorization', `Bearer ${token}`);

    expect(protectedRouteResponse.status).toBe(401);
    expect(protectedRouteResponse.body.message).toBe('Unauthorized');
  });

  it('should handle logout without token gracefully', async () => {
    const noTokenReq = {
      headers: {},
    };

    await logout(noTokenReq, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Logout successful" });
  });
});

describe('Security Test - POST /refresh-token', () => {
  let refreshToken, expiredRefreshToken, user;

  beforeEach(() => {
    refreshToken = jwt.sign({ id: '66b27856aab40f9d60dc30c7' }, process.env.SECRET, { expiresIn: '1h' });
    expiredRefreshToken = jwt.sign({ id: '66b27856aab40f9d60dc30c7' }, process.env.SECRET, { expiresIn: '-1h' });

    user = {
      _id: 'testId',
      email: 'test@example.com'
    };

    req = {
      body: {
        refreshToken: refreshToken
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should prevent reuse of expired refresh tokens', async () => {
    Token.findOne.mockResolvedValue({ refreshToken: expiredRefreshToken, user: user._id });
    User.findById.mockResolvedValue(user);

    await refreshTokenFn(req, res, next);

    const protectedRouteResponse = await request(app)
      .get('/admin/logs')
      .set('Authorization', `Bearer ${expiredRefreshToken}`);

    expect(protectedRouteResponse.status).toBe(401);
    expect(protectedRouteResponse.body.message).toBe('Unauthorized');
  });

  it('should handle refresh without token gracefully', async () => {
    const noTokenReq = {
      body: {
        refreshToken: '',
      },
    };

    await refreshTokenFn(noTokenReq, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
  });
});
