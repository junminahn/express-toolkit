import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app, seedDocuments } from './0.setup.spec';

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
  it('should have 3 users returned for admin role', (done) => {
    request(app)
      .get('/api/users')
      .set('User', 'user1')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body.length).to.equal(3);
        done();
      });
  });

  it('should have 2 users returned for user role', (done) => {
    request(app)
      .get('/api/users')
      .set('User', 'user2')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        console.log('response.body', response.body);
        expect(response.body.length).to.equal(2);
        done();
      });
  });

  it('should not include `orgs` field returned for any role', (done) => {
    request(app)
      .get('/api/users')
      .set('User', 'user1')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body[0]).to.have.property('name');
        expect(response.body[0]).to.not.have.property('orgs');
        done();
      });
  });

  it('should include `statusHistory` field returned for admin role', (done) => {
    request(app)
      .get('/api/users')
      .set('User', 'user1')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body[0]).to.have.property('statusHistory');
        done();
      });
  });

  it('should not include `statusHistory` field returned for user role', (done) => {
    request(app)
      .get('/api/users')
      .set('User', 'user2')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body[0]).to.not.have.property('statusHistory');
        done();
      });
  });

  it('should include permissions `edit.status` set to true for admin role', (done) => {
    request(app)
      .get('/api/users')
      .set('User', 'user1')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        for (let x = 0; x < response.body.length; x++) {
          expect(response.body[x]._permissions['edit.status']).to.be.true;
        }
        done();
      });
  });

  it('should not include permissions `edit.status` set to false for user role', (done) => {
    request(app)
      .get('/api/users')
      .set('User', 'user2')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        for (let x = 0; x < response.body.length; x++) {
          expect(response.body[x]._permissions['edit.status']).to.be.false;
        }
        done();
      });
  });

  it('should include permissions `edit.name` set to true for requesting user only', (done) => {
    request(app)
      .get('/api/users')
      .set('User', 'user3')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        for (let x = 0; x < response.body.length; x++) {
          const me = String(response.body[x].name) === 'user3';
          console.log('memememe', response.body[x].name, response.body[x]._permissions['edit.name'], me);
          expect(response.body[x]._permissions['edit.name']).to.equal(me);
        }
        done();
      });
  });
});

describe('Read Route', async () => {
  it('should have users2 returned for admin user', (done) => {
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

  it('should not have users2 (public) returned for user3', (done) => {
    request(app)
      .get(`/api/users/${seedDocuments.user2._id}`)
      .set('User', 'user3')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body._id).to.equal(String(seedDocuments.user2._id));
        done();
      });
  });

  it('should have user3 returned for user3', (done) => {
    request(app)
      .get(`/api/users/${seedDocuments.user3._id}`)
      .set('User', 'user3')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body._id).to.equal(String(seedDocuments.user3._id));
        done();
      });
  });

  it('should include `statusHistory` field returned for admin role', (done) => {
    request(app)
      .get(`/api/users/${seedDocuments.user2._id}`)
      .set('User', 'user1')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body).to.have.property('statusHistory');
        done();
      });
  });

  it('should not include `statusHistory` field returned for user role', (done) => {
    request(app)
      .get(`/api/users/${seedDocuments.user2._id}`)
      .set('User', 'user2')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body).to.not.have.property('statusHistory');
        done();
      });
  });
});

// describe('Create Route', async () => {
//   it('should create an user', (done) => {
//     request(app).get('/api/users').expect('Content-Type', /json/).expect(200, [], done);
//   });
// });

// after(async function () {
//   await down({ dropDatabase: true });
// });
