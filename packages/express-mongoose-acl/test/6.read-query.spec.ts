import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app, seedDocuments } from './0.setup.spec';

describe('Read Query Route', async () => {
  it('should create an user', (done) => {
    request(app)
      .post(`/api/users/__query/${seedDocuments.user1._id}`)
      .set('User', 'user1')
      // .send({ name: 'john' })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        console.log(response.body);
        // expect(response.body.name).to.equal('john');
        done();
      })
      .catch(console.error);
  });
});
