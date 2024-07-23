const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Community = require('../../models/community.model');
const jwt = require('jsonwebtoken');


describe('Integration Test - Admin Controller - addModerator', () => {
  let communityId, moderatorId, community;

  beforeEach(async () => {
    await Community.deleteMany({});

    // Create a new community for testing
    communityId = mongoose.Types.ObjectId();
    moderatorId = mongoose.Types.ObjectId();
    community = new Community({
      _id: communityId,
      name: 'Test Community',
      moderators: [],
      members: [],
      description: 'This is a test community',
    });
    await community.save();
  });

  it('should return 404 if community is not found', async () => {
    const response = await request(app)
      .patch('/admin/add-moderators')
      .query({
        communityId: mongoose.Types.ObjectId().toString(),
        moderatorId: moderatorId.toString(),
      })
      .set('Authorization', `Bearer ${jwt.sign({ id: '66a006fa258652aa7e4095e8' }, process.env.SECRET)}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Community not found');
  });

  it('should return 400 if user is already a moderator', async () => {
    community.moderators.push(moderatorId);
    await community.save();

    const response = await request(app)
      .patch('/admin/add-moderators')
      .query({
        communityId: communityId.toString(),
        moderatorId: moderatorId.toString(),
      })
      .set('Authorization', `Bearer ${jwt.sign({ id: '66a006fa258652aa7e4095e8' }, process.env.SECRET)}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Already a moderator');
  });

  it('should add moderator and return 200', async () => {
    const response = await request(app)
      .patch('/admin/add-moderators')
      .query({
        communityId: communityId.toString(),
        moderatorId: moderatorId.toString(),
      })
      .set('Authorization', `Bearer ${jwt.sign({ id: '66a006fa258652aa7e4095e8' }, process.env.SECRET)}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Moderator added');

    const updatedCommunity = await Community.findById(communityId);
    expect(updatedCommunity.moderators).toContainEqual(moderatorId);
    expect(updatedCommunity.members).toContainEqual(moderatorId);
  });

  it('should return 500 if there is a server error', async () => {
    jest.spyOn(Community, 'findById').mockRejectedValueOnce(new Error('Server error'));

    const response = await request(app)
      .patch('/admin/add-moderators')
      .query({
        communityId: communityId.toString(),
        moderatorId: moderatorId.toString(),
      })
      .set('Authorization', `Bearer ${jwt.sign({ id: '66a006fa258652aa7e4095e8' }, process.env.SECRET)}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Error adding moderator');
  });
});
