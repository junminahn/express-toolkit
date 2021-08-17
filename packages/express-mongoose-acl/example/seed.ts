import mongoose from 'mongoose';

export const seed = async () => {
  const Location = mongoose.model('Location');
  const Org = mongoose.model('Org');
  const Document = mongoose.model('Document');
  const User = mongoose.model('User');

  const org1location1 = await Location.create({ name: 'location1' });
  const org1location2 = await Location.create({ name: 'location2' });
  const org1location3 = await Location.create({ name: 'location3' });
  const org2location1 = await Location.create({ name: 'location1' });
  const org2location2 = await Location.create({ name: 'location2' });

  const org1 = await Org.create({ name: 'org1', locations: [org1location1, org1location2, org1location3] });
  const org2 = await Org.create({ name: 'org2', locations: [org2location1, org2location2] });

  const document1 = await Document.create({ name: 'document1' });
  const document2 = await Document.create({ name: 'document2' });
  const document3 = await Document.create({ name: 'document3' });

  const user1 = await User.create({
    name: 'user1',
    role: 'admin',
  });

  const user2 = await User.create({
    name: 'user2',
    role: 'user',
    statusHistory: [
      { name: 'status1', approved: true, document: document1 },
      { name: 'status2', approved: false },
      { name: 'status3', approved: true, document: document2 },
      { name: 'status4', approved: false },
      { name: 'status5', approved: true, document: document3 },
    ],
    orgs: [org1],
  });

  return { user1, user2, org1, org2 };
};
