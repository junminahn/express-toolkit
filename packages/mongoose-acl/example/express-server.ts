import express from 'express';
import session from 'express-session';
import mongoose, { mongo } from 'mongoose';
import memorystore from 'memorystore';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import _ from 'lodash';
import db from './db';
import loadModels from './models';
import routes from './routes';
import { COOKIE_SESSION_NAME, COOKIE_SESSION_SECRET } from './config';
import macl from '../src';

console.log(!!loadModels());

macl.setGlobalOption('permissionField', '_permissions');

macl.set('globalPermissions', async function (req) {
  const User = mongoose.model('User');
  const userName = req.headers.user;

  let user;
  if (userName) {
    user = await User.findOne({ name: userName });
  }

  req._user = user;
  return { isAdmin: user?.role === 'admin' };
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
