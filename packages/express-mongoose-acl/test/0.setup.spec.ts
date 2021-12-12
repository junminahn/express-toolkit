import 'mocha';

import initExpresss from '../example/express-server';
import { down, dropDatabase } from '../example/db';
import { seed } from '../example/seed';

const DATABASE_URL = 'mongodb://localhost:27017/acl-test';

export let app = null;
export let seedDocuments: { admin: any; user1: any; user2: any; user3: any; org1: any; org2: any } = {
  admin: {},
  user1: {},
  user2: {},
  user3: {},
  org1: {},
  org2: {},
};

before(async function () {
  console.log('setup tests');
  app = await initExpresss({ databaseUrl: DATABASE_URL });
  await dropDatabase();
  seedDocuments = await seed();
});

after(async function () {
  await down({ dropDatabase: true });
});
