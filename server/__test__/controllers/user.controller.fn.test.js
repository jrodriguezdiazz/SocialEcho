const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../../models/user.model');
const { addUser } = require('../../controllers/user.controller');
const { updateInfo } = require('../../controllers/user.controller');

jest.mock('../../models/user.model');
jest.mock('bcrypt');


describe('user.controller.js', () => {
  describe('functional', () => {

    let req, res, next;

    beforeEach(() => {
      req = {
        body: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          isConsentGiven: 'false',
        },
        files: [],
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
      };

      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      next = jest.fn();
    });

    it('should add a new user successfully', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.prototype.save = jest.fn().mockResolvedValue(true);

      await addUser(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, 10);
      expect(User.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User added successfully',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next middleware if consent is given', async () => {
      req.body.isConsentGiven = 'true';
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.prototype.save = jest.fn().mockResolvedValue(true);

      await addUser(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, 10);
      expect(User.prototype.save).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should return error if user cannot be added', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.prototype.save = jest.fn().mockRejectedValue(new Error('Failed to add user'));

      await addUser(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, 10);
      expect(User.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to add user',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should set default avatar if no file is uploaded', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.prototype.save = jest.fn().mockResolvedValue(true);

      await addUser(req, res, next);

      const newUser = User.mock.lastCall[0]
      expect(newUser.avatar).toBe('https://raw.githubusercontent.com/nz-m/public-files/main/dp.jpg');
    });

    it('should set uploaded avatar if file is uploaded', async () => {
      req.files = [{ filename: 'avatar.jpg' }];
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.prototype.save = jest.fn().mockResolvedValue(true);

      await addUser(req, res, next);

      const newUser = User.mock.lastCall[0]
      expect(newUser.avatar).toBe('http://localhost:3000/assets/userAvatars/avatar.jpg');
    });

    it('should assign "moderator" role if email domain is "mod.socialecho.com"', async () => {
      req.body.email = 'moderator@mod.socialecho.com';
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.prototype.save = jest.fn().mockResolvedValue(true);

      await addUser(req, res, next);

      const newUser = User.mock.lastCall[0]
      expect(newUser.role).toBe('moderator');
    });

    it('should assign "general" role if email domain is not "mod.socialecho.com"', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.prototype.save = jest.fn().mockResolvedValue(true);

      await addUser(req, res, next);

      const newUser = User.mock.lastCall[0]
      expect(newUser.role).toBe('general');
    });
  });
});

describe('User Controller - updateInfo', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      userId: mongoose.Types.ObjectId().toString(),
      body: {
        location: 'New York',
        interests: 'coding, music',
        bio: 'Software developer'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  it('should return 404 if user is not found', async () => {
    User.findById.mockResolvedValue(null);

    await updateInfo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('should update user info and return 200', async () => {
    const mockUser = {
      save: jest.fn(),
      location: '',
      interests: '',
      bio: ''
    };

    User.findById.mockResolvedValue(mockUser);

    await updateInfo(req, res, next);

    expect(mockUser.location).toBe('New York');
    expect(mockUser.interests).toBe('coding, music');
    expect(mockUser.bio).toBe('Software developer');
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'User info updated successfully' });
  });

  it('should return 500 if there is a server error', async () => {
    User.findById.mockRejectedValue(new Error('Server error'));

    await updateInfo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error updating user info' });
  });
});
