import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Read User', () => {
  it('should return the target user', async () => {
    const response = await request(app)
      .get('/api/users/john')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('john');
    expect(response.body._permissions).exist;
  });

  it('should not return the target user by read privilege', async () => {
    const response = await request(app)
      .get('/api/users/lucy?try_list=false')
      .set('user', 'john')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).to.null;
  });

  it('should not return the target user by list privilege', async () => {
    const response = await request(app)
      .get('/api/users/lucy2?try_list=true')
      .set('user', 'john')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('lucy2');
  });

  it('should not include document permissions', async () => {
    const response = await request(app)
      .get('/api/users/lucy2?include_permissions=false')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body._permissions).not.exist;
  });
});
