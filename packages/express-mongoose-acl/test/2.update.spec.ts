import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { app } from './0.setup.spec';

describe('Update Users', () => {
  it('should update an user `john` by admin', async () => {
    const orgs = await mongoose.model('Org').find({ name: 'red' });
    const statusDocument = await mongoose.model('Document').create({ name: 'registration form' });

    const response = await request(app)
      .put('/api/users/john')
      .set('user', 'admin')
      .send({
        orgs: orgs.map((org) => org._id),
        statusHistory: [{ name: 'junior', approved: true, document: statusDocument }],
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('john');
    expect(response.body.orgs[0]).to.equal(String(orgs[0]._id));
    expect(response.body.statusHistory[0].name).to.equal('junior');
  });

  it('should update an user `lucy` by admin', async () => {
    const orgs = await mongoose.model('Org').find({ name: ['blue', 'purple'] });
    const statusDocument = await mongoose.model('Document').create({ name: 'registration form' });

    const response = await request(app)
      .put('/api/users/lucy')
      .set('user', 'admin')
      .send({
        orgs: orgs.map((org) => org._id),
        statusHistory: [
          { name: 'junior', approved: false, document: statusDocument },
          { name: 'senior', approved: true },
        ],
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('lucy');
    expect(response.body.orgs.length).to.equal(2);
    expect(response.body.statusHistory[0].approved).to.equal(false);
  });

  it('should update allowed fields for `lucy`', async () => {
    const response = await request(app)
      .put('/api/users/lucy')
      .set('user', 'lucy')
      .send({
        name: 'lucy2',
        orgs: [],
        statusHistory: [],
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('lucy2');
    expect(response.body.orgs.length).to.equal(2);
    expect(response.body.statusHistory).to.be.undefined;
  });
});
