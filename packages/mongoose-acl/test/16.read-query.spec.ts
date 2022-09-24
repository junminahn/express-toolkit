import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Read-Query User', () => {
  it('should return the target user', async () => {
    const response = await request(app)
      .post('/api/users/__query/john')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('john');
    expect(response.body._permissions).exist;
  });

  it('should not return the target user by read privilege', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy')
      .set('user', 'john')
      .send({ tryList: false })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).to.null;
  });

  it('should not return the target user by list privilege', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'john')
      .send({ tryList: true })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('lucy2');
  });

  it('should not include document permissions', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'admin')
      .send({ options: { includePermissions: false } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body._permissions).not.exist;
  });

  it('should return the unpopulated user orgs', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'john')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('lucy2');
    expect(response.body.orgs[0]).to.be.a('string');
  });

  it('should return the populated user orgs with read access', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'john')
      .send({ populate: 'orgs' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('lucy2');
    expect(response.body.orgs.length).to.equal(2);
    expect(response.body.orgs[0]).to.be.a('object');
  });

  it('should return the populated user orgs with list access', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'john')
      .send({ populate: { path: 'orgs', access: 'list' } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('lucy2');
    expect(response.body.orgs.length).to.equal(2);
    expect(response.body.orgs[0]).to.be.a('object');
  });

  it('should return the passed field selection only', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'admin')
      .send({ select: '_id' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body._id).to.exist;
    expect(response.body.name).to.not.exist;
    expect(response.body.orgs).to.not.exist;
  });

  it('should exclude _id field', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'admin')
      .send({ select: '-_id name' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body._id).to.not.exist;
    expect(response.body.name).to.exist;
  });

  it('should exclude _id field', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'admin')
      .send({ select: ['-_id', 'name'] })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body._id).to.not.exist;
    expect(response.body.name).to.exist;
  });

  it('should exclude _id field', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'admin')
      .send({ select: { _id: -1, name: 1 } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body._id).to.not.exist;
    expect(response.body.name).to.exist;
  });

  it('should exclude _id and name fields', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'admin')
      .send({ select: '-_id -name' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body._id).to.not.exist;
    expect(response.body.name).to.not.exist;
    expect(response.body.role).to.exist;
    expect(response.body.public).to.exist;
    expect(response.body.statusHistory).to.exist;
    expect(response.body.orgs).to.exist;
  });

  it('should exclude _id and name fields', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'admin')
      .send({ select: ['-_id', '-name'] })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body._id).to.not.exist;
    expect(response.body.name).to.not.exist;
    expect(response.body.role).to.exist;
    expect(response.body.public).to.exist;
    expect(response.body.statusHistory).to.exist;
    expect(response.body.orgs).to.exist;
  });

  it('should exclude _id and name fields', async () => {
    const response = await request(app)
      .post('/api/users/__query/lucy2')
      .set('user', 'admin')
      .send({ select: { _id: -1, name: -1 } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body._id).to.not.exist;
    expect(response.body.name).to.not.exist;
    expect(response.body.role).to.exist;
    expect(response.body.public).to.exist;
    expect(response.body.statusHistory).to.exist;
    expect(response.body.orgs).to.exist;
  });
});
