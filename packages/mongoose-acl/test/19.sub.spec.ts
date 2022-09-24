import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Sub-Document User', () => {
  it('should return allowed fields for status history list route', async () => {
    const response = await request(app)
      .get('/api/users/lucy2/statusHistory')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(2);
    expect(response.body[0].name).exist;
    expect(response.body[0].approved).exist;
    expect(response.body[0].document).not.exist;
  });

  it('should return expected fields for status history list query route', async () => {
    const response = await request(app)
      .post('/api/users/lucy2/statusHistory/__query')
      .set('user', 'lucy2')
      .send({ filter: { approved: true }, fields: ['name'] })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).exist;
    expect(response.body[0].approved).not.exist;
    expect(response.body[0].document).not.exist;
  });

  it('should return allowed fields for status history read route', async () => {
    const lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const subId = String(lucy2.statusHistory[0]._id);

    const response = await request(app)
      .get(`/api/users/lucy2/statusHistory/${subId}`)
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.id).to.equal(subId);
    expect(response.body.name).exist;
    expect(response.body.approved).exist;
    expect(response.body.document).to.be.a('string');
  });

  it('should return expected fields for status history read query route', async () => {
    const lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const subId = String(lucy2.statusHistory[0]._id);

    const response = await request(app)
      .post(`/api/users/lucy2/statusHistory/${subId}/__query`)
      .set('user', 'admin')
      .send({ fields: ['name'] })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.id).to.equal(subId);
    expect(response.body.name).exist;
    expect(response.body.approved).not.exist;
    expect(response.body.document).not.exist;
  });

  it('should return updated fields for status history update route', async () => {
    let lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    let firstStatus = lucy2.statusHistory[0];
    let subId = String(firstStatus._id);

    const newName = firstStatus.name + '2';
    const oldApproved = firstStatus.approved;

    const response = await request(app)
      .put(`/api/users/lucy2/statusHistory/${subId}`)
      .set('user', 'admin')
      .send({ name: newName, approved: !firstStatus.approved })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.id).to.equal(subId);
    expect(response.body.name).to.equal(newName);
    expect(response.body.approved).to.equal(oldApproved);

    lucy2 = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    firstStatus = lucy2.statusHistory[0];

    expect(firstStatus.name).to.equal(newName);
    expect(firstStatus.approved).to.equal(oldApproved);
  });

  it('should add a new status through status history create route', async () => {
    const lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const count = lucy2.statusHistory.length;

    const response = await request(app)
      .post(`/api/users/lucy2/statusHistory`)
      .set('user', 'admin')
      .send({ name: 'manager', approved: true })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(count + 1);
    expect(response.body[count].name).to.equal('manager');
    expect(response.body[count].approved).to.equal(true);
  });

  it('should delete a status through status history delete route', async () => {
    let lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const initialCount = lucy2.statusHistory.length;
    let secondStatus = lucy2.statusHistory[1];
    let subId = String(secondStatus._id);

    const response = await request(app)
      .delete(`/api/users/lucy2/statusHistory/${subId}`)
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).to.equal(subId);

    lucy2 = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    expect(lucy2.statusHistory.length).to.equal(initialCount - 1);
  });

  it('should return unpopulated document field for status history read query route', async () => {
    const lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const subId = String(lucy2.statusHistory[0]._id);

    const response = await request(app)
      .post(`/api/users/lucy2/statusHistory/${subId}/__query`)
      .set('user', 'admin')
      .send({ fields: ['document'] })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.id).to.equal(subId);
    expect(response.body.document).to.be.a('string');
  });

  it('should return populated document field for status history read query route', async () => {
    const lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const subId = String(lucy2.statusHistory[0]._id);
    const documentId = String(lucy2.statusHistory[0].document);

    const response = await request(app)
      .post(`/api/users/lucy2/statusHistory/${subId}/__query`)
      .set('user', 'admin')
      .send({ fields: ['document'], populate: ['document'] })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.id).to.equal(subId);
    expect(response.body.document._id).to.equal(documentId);
  });
});
