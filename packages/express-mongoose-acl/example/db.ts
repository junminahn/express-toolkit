// see https://mongoosejs.com/docs/connections.html
import chalk from 'chalk';
import mongoose from 'mongoose';

mongoose.set('debug', true);

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
    await mongoose.connect(databaseUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('%s MongoDB is connected successfully.', chalk.green('✓'));
  } catch (error) {
    console.error(error);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  }

  mongoose.connection.on('error', (error) => {
    console.error(error);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  });
};

export const down = async ({ dropDatabase = false } = {}) => {
  if (dropDatabase) await mongoose.connection.db.dropDatabase();

  try {
    await mongoose.disconnect();
    console.log('%s MongoDB is disconnection successfully.', chalk.green('✓'));
  } catch (error) {
    console.error(error);
    console.log('%s MongoDB disconnection error.', chalk.red('✗'));
  }
};

export const dropDatabase = async () => {
  await mongoose.connection.db.dropDatabase();
};

export default { up, down, dropDatabase };