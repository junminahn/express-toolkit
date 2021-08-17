import express from 'express';
const router = express.Router();

import auth from './auth';
import { NODE_ENV } from '../config';
import ModelRouter from '../../src';

const userRouter = new ModelRouter('User', {
  baseUrl: null,
  permissionSchema: {
    name: { list: true, read: true },
    role: { list: false, read: true },
    statusHistory: {
      list: false,
      read: (permissions) => {
        return permissions.isAdmin;
      },
    },
    orgs: { list: false, read: true },
  },
  docPermissions: function (doc, permissions) {
    const p = {
      'edit.status': false,
      'edit.name': false,
    };

    if (permissions.isAdmin) {
      p['edit.status'] = true;
    }

    return p;
  },
  baseQuery: {
    list: () => {
      return {};
    },
    read: (permissions) => {
      if (permissions.isAdmin) return {};
      else return { _id: permissions.userId };
    },
    update: (permissions) => {
      if (permissions.isAdmin) return {};
      else return { _id: permissions.userId };
    },
    delete: (permissions) => {
      if (permissions.isAdmin) return {};
      else return { _id: permissions.userId };
    },
  },
  decorator: {
    update: function (doc) {
      return doc;
    },
  },
});

const orgRouter = new ModelRouter('Org', {
  baseUrl: null,
  permissionSchema: { name: { read: true } },
  docPermissions: () => {
    return { read: false, edit: true };
  },
});

router.use('/auth', auth);
router.use('/', userRouter.routes);
router.use('/', orgRouter.routes);

// catch 404 and forward to error handler
router.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
// no stacktraces leaked to user unless in development environment
router.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: NODE_ENV === 'development' ? err : {},
  });
});

export default router;
