import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('List Users', () => {
  it('should list all users for admin', async () => {
    const userCount = await mongoose.model('User').countDocuments();

    const response = await request(app)
      .get('/api/users')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(userCount);
    expect(response.body[0].name).exist;
    expect(response.body[0].role).exist;
    expect(response.body[0]._permissions).exist;
  });

  it('should list all public users and `john`', async () => {
    const userCount = await mongoose.model('User').countDocuments({ $or: [{ public: true }, { name: 'john' }] });

    const response = await request(app)
      .get('/api/users')
      .set('user', 'john')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(userCount);
    expect(response.body[0].name).exist;
    expect(response.body[0].role).not.exist;
    expect(response.body[0]._permissions).exist;
  });

  it('should list all public users and `lucy2`', async () => {
    const userCount = await mongoose.model('User').countDocuments({ $or: [{ public: true }, { name: 'lucy2' }] });

    const response = await request(app)
      .get('/api/users')
      .set('user', 'lucy2')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(userCount);
    expect(response.body[0].name).exist;
    expect(response.body[0].role).not.exist;
    expect(response.body[0]._permissions).exist;
  });

  it('should include document count with documents', async () => {
    const userCount = await mongoose.model('User').countDocuments();

    const response = await request(app)
      .get('/api/users?include_count=true')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.count).to.equal(userCount);
    expect(response.body.rows.length).to.equal(userCount);
    expect(response.body.rows[0].name).exist;
    expect(response.body.rows[0].role).exist;
    expect(response.body.rows[0]._permissions).exist;
  });

  it('should not include permissions in documents', async () => {
    const response = await request(app)
      .get('/api/users?include_permissions=false')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body[0]._permissions).not.exist;
  });

  it('should return the first user', async () => {
    const users: any = await mongoose.model('User').find({}).limit(1);

    const response = await request(app)
      .get('/api/users?limit=1')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal(users[0].name);
  });

  it('should return the second user', async () => {
    const users: any = await mongoose.model('User').find({}).limit(1).skip(1);

    const response = await request(app)
      .get('/api/users?limit=1&page=2')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal(users[0].name);
  });
});
