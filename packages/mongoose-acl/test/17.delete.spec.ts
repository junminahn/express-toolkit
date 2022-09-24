import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Delete User', () => {
  it('should not delete a user by user', async () => {
    const user = await mongoose.model('User').findOne({ name: 'john' });

    const response = await request(app)
      .delete('/api/users/john')
      .set('user', 'lucy2')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body).to.not.equal(String(user._id));
  });

  it('should delete a user by admin', async () => {
    const user = await mongoose.model('User').findOne({ name: 'john' });

    const response = await request(app)
      .delete('/api/users/john')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).to.equal(String(user._id));
  });
});
