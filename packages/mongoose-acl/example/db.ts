// see https://mongoosejs.com/docs/connections.html
import mongoose from 'mongoose';

mongoose.set('debug', false);

import { DATABASE_URI } from './config';

declare global {
  interface MongooseSchema extends mongoose.Schema {
    options?: any;
  }
}

export const up = async ({ databaseUrl = DATABASE_URI } = {}) => {
  mongoose.plugin((schema: MongooseSchema) => {
    schema.options.timestamps = true;
  });

  try {
    await mongoose.connect(databaseUrl);
    console.log('%s MongoDB is connected successfully.', '✓');
  } catch (error) {
    console.error(error);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', '✗');
  }

  mongoose.connection.on('error', (error) => {
    console.error(error);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', '✗');
  });
};

export const down = async ({ dropDatabase = false } = {}) => {
  if (dropDatabase) await mongoose.connection.db.dropDatabase();

  try {
    await mongoose.disconnect();
    console.log('%s MongoDB is disconnection successfully.', '✓');
  } catch (error) {
    console.error(error);
    console.log('%s MongoDB disconnection error.', '✗');
  }
};

export const dropDatabase = async () => {
  await mongoose.connection.db.dropDatabase();
};

export default { up, down, dropDatabase };
