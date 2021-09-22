import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app, seedDocuments } from './0.setup.spec';

describe('Create Route', async () => {
  it('should create an user', (done) => {
    request(app)
      .post('/api/users')
      .send({ name: 'john' })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((response) => {
        console.log(response.body);
        expect(response.body.name).to.equal('john');
        done();
      })
      .catch(console.error);
  });
});
