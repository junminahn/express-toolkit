import mongoose from 'mongoose';
import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';
import macl from '../src';

describe('Global Permissions', () => {
  it('should create an user `user1` by admin', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('user', 'admin')
      .send({ name: 'user1', role: 'user', public: false })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.equal('user1');
    expect(response.body.role).to.equal('user');
    expect(response.body.public).to.equal(false);
  });

  it('should create an user `user2` by admin', async () => {
    macl.set('globalPermissions', async function (req) {
      const User = mongoose.model('User');
      const userName = req.headers.user;

      let user;
      if (userName) {
        user = await User.findOne({ name: userName });
      }

      req._user = user;
      return user?.role === 'admin' ? ['isAdmin'] : [];
    });

    const response = await request(app)
      .post('/api/users')
      .set('user', 'admin')
      .send({ name: 'user2', role: 'user', public: false })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.equal('user2');
    expect(response.body.role).to.equal('user');
    expect(response.body.public).to.equal(false);
  });

  it('should create an user `user3` by admin', async () => {
    macl.set('globalPermissions', async function (req) {
      const User = mongoose.model('User');
      const userName = req.headers.user;

      let user;
      if (userName) {
        user = await User.findOne({ name: userName });
      }

      req._user = user;
      return user?.role === 'admin' ? 'isAdmin' : null;
    });

    const response = await request(app)
      .post('/api/users')
      .set('user', 'admin')
      .send({ name: 'user3', role: 'user', public: false })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.equal('user3');
    expect(response.body.role).to.equal('user');
    expect(response.body.public).to.equal(false);
  });
});
