const request = require('supertest');
const app = require('../../app');
const User = require('../../models/user.model');
describe('user.controller.js', () => {

  describe('integration', () => {

    beforeEach(async () => {
      // Clean up the users collection before each test
      await User.deleteMany({});
    });

    it('should add a new user successfully', async () => {
      const response = await request(app)
        .post('/users/signup')
        .field('name', 'John Doe')
        .field('email', 'john.doe@example.com')
        .field('password', 'welc0me19;')
        .field('isConsentGiven', 'false');

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User added successfully');

      const user = await User.findOne({ email: 'john.doe@example.com' });

      expect(user).not.toBeNull();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john.doe@example.com');
    });


    it('should return error if user cannot be added', async () => {
      const mockUserSave = jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Failed to add user');
      });

      const response = await request(app)
        .post('/users/signup')
        .field('name', 'John Doe')
        .field('email', 'john.doe@example.com')
        .field('password', 'password123')
        .field('isConsentGiven', 'false');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Failed to add user');

      mockUserSave.mockRestore();
    });

    it('should set default avatar if no file is uploaded', async () => {
      const response = await request(app)
        .post('/users/signup')
        .field('name', 'John Doe')
        .field('email', 'john.doe@example.com')
        .field('password', 'password123')
        .field('isConsentGiven', 'false');

      const user = await User.findOne({ email: 'john.doe@example.com' });
      expect(user.avatar).toBe('https://raw.githubusercontent.com/nz-m/public-files/main/dp.jpg');
    });


    it('should assign "moderator" role if email domain is "mod.socialecho.com"', async () => {
      const response = await request(app)
        .post('/users/signup')
        .field('name', 'John Doe')
        .field('email', 'moderator@mod.socialecho.com')
        .field('password', 'password123')
        .field('isConsentGiven', 'false');

      const user = await User.findOne({ email: 'moderator@mod.socialecho.com' });
      expect(user.role).toBe('moderator');
    });

    it('should assign "general" role if email domain is not "mod.socialecho.com"', async () => {
      const response = await request(app)
        .post('/users/signup')
        .field('name', 'John Doe')
        .field('email', 'john.doe@example.com')
        .field('password', 'password123')
        .field('isConsentGiven', 'false');

      const user = await User.findOne({ email: 'john.doe@example.com' });
      expect(user.role).toBe('general');
    });
  });
});
