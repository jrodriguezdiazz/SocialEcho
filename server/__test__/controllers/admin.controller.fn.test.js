const mongoose = require('mongoose');
const Community = require('../../models/community.model');
const { addModerator } = require('../../controllers/admin.controller');

jest.mock('../../models/community.model');

describe('Admin Controller - addModerator', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {
        communityId: mongoose.Types.ObjectId().toString(),
        moderatorId: mongoose.Types.ObjectId().toString(),
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  it('should return 404 if community is not found', async () => {
    Community.findById.mockResolvedValue(null);

    await addModerator(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Community not found' });
  });

  it('should return 400 if user is already a moderator', async () => {
    const mockCommunity = {
      moderators: [req.query.moderatorId],
      members: [],
      save: jest.fn(),
    };
    Community.findById.mockResolvedValue(mockCommunity);

    await addModerator(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Already a moderator' });
  });

  it('should add moderator and return 200', async () => {
    const mockCommunity = {
      moderators: [],
      members: [],
      save: jest.fn(),
    };
    Community.findById.mockResolvedValue(mockCommunity);

    await addModerator(req, res, next);

    expect(mockCommunity.moderators).toContain(req.query.moderatorId);
    expect(mockCommunity.members).toContain(req.query.moderatorId);
    expect(mockCommunity.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Moderator added' });
  });

  it('should return 500 if there is a server error', async () => {
    Community.findById.mockRejectedValue(new Error('Server error'));

    await addModerator(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error adding moderator' });
  });
});
