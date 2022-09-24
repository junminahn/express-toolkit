import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('List-Query Users', () => {
  it('should list all users for admin', async () => {
    const userCount = await mongoose.model('User').countDocuments();

    const response = await request(app)
      .post('/api/users/__query')
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
      .post('/api/users/__query')
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
      .post('/api/users/__query')
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
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ options: { includeCount: true } })
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
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ options: { includePermissions: false } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body[0]._permissions).not.exist;
  });

  it('should return the first user', async () => {
    const users: any = await mongoose.model('User').find({}).limit(1);

    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ limit: 1 })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal(users[0].name);
  });

  it('should return the second user', async () => {
    const users: any = await mongoose.model('User').find({}).limit(1).skip(1);

    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ limit: 1, page: 2 })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal(users[0].name);
  });

  it('should return the queries user', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ query: { name: 'john' } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).exist;
    expect(response.body[0].orgs).exist;
  });

  it('should return the selected fields - 1', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ query: { name: 'john' }, select: 'name' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).not.exist;
    expect(response.body[0].orgs).not.exist;
  });

  it('should return the selected fields - 2', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ query: { name: 'john' }, select: 'name role' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).to.equal('user');
    expect(response.body[0].orgs).not.exist;
  });

  it('should return the selected fields - 3', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ query: { name: 'john' }, select: ['name', 'role'] })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).to.equal('user');
    expect(response.body[0].orgs).not.exist;
  });

  it('should return the selected fields - 4', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ query: { name: 'john' }, select: { name: 1, role: 1 } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).to.equal('user');
    expect(response.body[0].orgs).not.exist;
  });

  it('should handle invalid select option', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ query: { name: 'john' }, select: ['name role'] })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).to.equal('user');
    expect(response.body[0].orgs).not.exist;
  });

  it('should return the unpopulated user orgs', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ query: { name: 'john' } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].orgs[0]).to.be.a('string');
  });

  it('should return the populated user orgs', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ query: { name: 'john' }, populate: 'orgs' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].orgs[0]).to.be.a('object');
  });

  it('should return the passed field selection only', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ query: {}, select: '_id' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body[0]._id).to.exist;
    expect(response.body[0].name).to.not.exist;
    expect(response.body[0].orgs).to.not.exist;

    expect(response.body[1]._id).to.exist;
    expect(response.body[1].name).to.not.exist;
    expect(response.body[1].orgs).to.not.exist;
  });
});

describe('List Sub-query', () => {
  it('should list orgs queried user.orgs field', async () => {
    const user: any = await mongoose.model('User').findOne({ name: 'lucy2' }).populate('orgs');
    const orgIds = user.orgs.map((v) => String(v._id));

    const response = await request(app)
      .post('/api/orgs/__query')
      .set('user', 'admin')
      .send({
        query: {
          _id: {
            $$sq: { model: 'User', mapper: { path: 'orgs', multi: false }, query: { name: 'lucy2' } },
          },
        },
      })
      .expect('Content-Type', /json/)
      .expect(200);

    const result = response.body.map((v) => String(v._id));
    expect(result).deep.equal(orgIds);
  });
});
