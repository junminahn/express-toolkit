import express from 'express';
import session from 'express-session';
import mongoose, { mongo } from 'mongoose';
import memorystore from 'memorystore';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import listEndpoints from 'express-list-endpoints';
import _ from 'lodash';
import db from './db';
import models from './models';
import routes from './routes';
import { COOKIE_SESSION_NAME, COOKIE_SESSION_SECRET } from './config';
import { setRootOption } from '../src/options';
import macl from '../src/middleware';

console.log(!!models);

setRootOption('rootPermissions', async function (req) {
  const User = mongoose.model('User');
  const userName = req.headers.user;

  let user;
  if (userName) {
    user = await User.findOne({ name: userName });
  }

  req._user = user;
  return { isAdmin: user?.role === 'admin', userId: user?._id };
});

const MemoryStore = memorystore(session);

const ONE_DAY = 24 * (60 * 60 * 1000);

const logger = morgan('combined');

interface Props {
  databaseUrl?: string;
}

const initExpresss = async (options?: Props) => {
  const { databaseUrl } = options || {};

  await db.up({ databaseUrl });

  const expressServer = express();

  expressServer.use(logger);
  expressServer.use(bodyParser.json());
  expressServer.use(bodyParser.urlencoded({ extended: false }));
  expressServer.use(cookieParser());

  const store = new MemoryStore({
    checkPeriod: ONE_DAY,
  });

  expressServer.use(
    session({
      name: COOKIE_SESSION_NAME,
      secret: COOKIE_SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: ONE_DAY,
        httpOnly: true,
        secure: false,
      },
      store,
    }),
  );

  expressServer.disable('x-powered-by');

  expressServer.set('trust proxy', 1);

  expressServer.use(macl());

  expressServer.use('/api', routes);

  listEndpoints(expressServer).forEach((endpoint) => {
    console.log(`${endpoint.path} (${endpoint.methods.join(', ')})`);
  });

  return expressServer;
};

export default initExpresss;

declare global {
  namespace Express {
    interface Request {
      _permissions?: any;
      _user?: any;
    }
  }

  interface Error {
    status?: number;
  }
}
