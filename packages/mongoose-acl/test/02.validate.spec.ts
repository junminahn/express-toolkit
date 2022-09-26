import mongoose from 'mongoose';
import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';
import { userRouter } from '../example/routes/user';

describe('Model Option - validate', () => {
  it('should not create an user `user-validate-err1` by admin', async () => {
    userRouter.validate(false);

    const response = await request(app)
      .post('/api/users')
      .set('user', 'admin')
      .send({ name: 'user-validate-err1', role: 'user', public: false })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.message).to.equal('validation failed');
    expect(response.body.errors.length).to.equal(0);
  });

  it('should not create an user `user-validate-err2` by admin', async () => {
    userRouter.validate(['error1', 'error2']);

    const response = await request(app)
      .post('/api/users')
      .set('user', 'admin')
      .send({ name: 'user-validate-err2', role: 'user', public: false })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.message).to.equal('validation failed');
    expect(response.body.errors.length).to.equal(2);
    expect(response.body.errors[0]).to.equal('error1');
    expect(response.body.errors[1]).to.equal('error2');
  });

  it('should not create an user `user-validate-err3` by admin', async () => {
    userRouter.validate(() => false);

    const response = await request(app)
      .post('/api/users')
      .set('user', 'admin')
      .send({ name: 'user-validate-err3', role: 'user', public: false })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.message).to.equal('validation failed');
    expect(response.body.errors.length).to.equal(0);
  });

  it('should not create an user `user-validate-err4` by admin', async () => {
    userRouter.validate(() => ['error1', 'error2']);

    const response = await request(app)
      .post('/api/users')
      .set('user', 'admin')
      .send({ name: 'user-validate-err4', role: 'user', public: false })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.message).to.equal('validation failed');
    expect(response.body.errors.length).to.equal(2);
    expect(response.body.errors[0]).to.equal('error1');
    expect(response.body.errors[1]).to.equal('error2');
  });

  it('should create an user `user-validate1` by admin', async () => {
    userRouter.validate(true);

    const response = await request(app)
      .post('/api/users')
      .set('user', 'admin')
      .send({ name: 'user-validate1', role: 'user', public: false })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.equal('user-validate1');
  });

  it('should create an user `user-validate2` by admin', async () => {
    userRouter.validate([]);

    const response = await request(app)
      .post('/api/users')
      .set('user', 'admin')
      .send({ name: 'user-validate2', role: 'user', public: false })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.equal('user-validate2');
  });

  it('should create an user `user-validate3` by admin', async () => {
    userRouter.validate(null);

    const response = await request(app)
      .post('/api/users')
      .set('user', 'admin')
      .send({ name: 'user-validate3', role: 'user', public: false })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.equal('user-validate3');
  });

  it('should pass the route validation', async () => {
    const response = await request(app)
      .get('/api/admin-route')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).to.equal(true);
  });

  it('should pass the route validation2', async () => {
    const response = await request(app)
      .get('/api/admin-route2')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).to.equal(true);
  });

  it('should pass the route validation', async () => {
    const response = await request(app).get('/api/admin-route').set('user', 'nobody').expect(500);
  });

  it('should return permissions for the user document', async () => {
    const response = await request(app)
      .get('/api/user-custom')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body['edit.name']).to.equal(true);
    expect(response.body['edit.role']).to.equal(true);
    expect(response.body['edit.public']).to.equal(true);
  });
});
