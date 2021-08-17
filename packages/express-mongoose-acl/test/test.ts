import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import initExpresss from '../example/express-server';
import { down, dropDatabase } from '../example/db';
import { seed } from '../example/seed';

const DATABASE_URL = 'mongodb://localhost:27017/acl-test';
let app = null;
let seedDocuments: { user1: any; user2: any; org1: any; org2: any } = { user1: {}, user2: {}, org1: {}, org2: {} };

before(async function () {
  app = await initExpresss({ databaseUrl: DATABASE_URL });
  await dropDatabase();
  seedDocuments = await seed();
});

// describe('Create Route', async () => {
//   it('should create an user', (done) => {
//     request(app)
//       .post('/api/users')
//       .send({ name: 'john' })
//       .expect('Content-Type', /json/)
//       .expect(201)
//       .then((response) => {
//         expect(response.body.name).to.equal('john');
//         done();
//       });
//   });
// });

describe('List Route', async () => {
  it('should list users', (done) => {
    request(app)
      .get('/api/users')
      .set('User', 'user1')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body.length).to.equal(2);
        done();
      });
  });
});

describe('List Route2', async () => {
  it('should list users2', (done) => {
    request(app)
      .get(`/api/users/${seedDocuments.user2._id}`)
      .set('User', 'user1')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body._id).to.equal(String(seedDocuments.user2._id));
        done();
      });
  });
});

describe('List Route22', async () => {
  it('should list users22', (done) => {
    request(app)
      .get(`/api/users/${seedDocuments.user1._id}`)
      .set('User', 'user2')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body).to.equal(null);
        done();
      });
  });
});

// describe('Create Route', async () => {
//   it('should create an user', (done) => {
//     request(app).get('/api/users').expect('Content-Type', /json/).expect(200, [], done);
//   });
// });

after(async function () {
  await down({ dropDatabase: true });
});
