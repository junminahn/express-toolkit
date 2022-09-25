import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Root Routes - Create User', () => {
  it('should create an user `user-root1` by admin', async () => {
    const response = await request(app)
      .post('/api/macl/__query')
      .set('user', 'admin')
      .send([
        {
          modelName: 'User',
          operation: 'create',
          arguments: { name: 'user-root1', role: 'user', public: false },
        },
      ])
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('user-root1');
    expect(response.body[0].role).to.equal('user');
    expect(response.body[0].public).to.equal(false);
  });
});
