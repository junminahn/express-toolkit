import ModelRouter from '../../src';
import { Permissions } from '../../src/permission';

// baseUrl: false,
// permissionSchema,
// decorate,
// decorateAll,
// transform,
// prepare,
// baseQuery,
// docPermissions,
// routeGuard: true,

const userRouter = new ModelRouter('User', {
  baseUrl: null,
  permissionSchema: {
    name: { list: true, read: true, update: 'edit.name', create: true },
    role: { list: 'isAdmin', read: true, update: 'edit.role', create: true },
    public: { list: false, read: true, update: 'edit.public', create: true },
    statusHistory: {
      list: (permissions) => {
        return false;
      },
      read: (permissions) => {
        return permissions.isAdmin;
      },
      update: (permissions, modelPermissions) => {
        return modelPermissions['edit.statusHistory'];
      },
    },
    orgs: { list: true, read: true, update: 'edit.orgs' },
  },
  docPermissions: function (doc, permissions) {
    const isMe = String(doc._id) === String(permissions.userId);
    const p = {
      'edit.name': permissions.isAdmin || isMe,
      'edit.role': permissions.isAdmin,
      'edit.public': permissions.isAdmin,
      'edit.statusHistory': permissions.isAdmin,
      'edit.orgs': permissions.isAdmin,
    };

    return p;
  },
  baseQuery: {
    list: (permissions: Permissions) => {
      if (permissions.isAdmin) return {};
      else return { $or: [{ _id: permissions.userId }, { public: true }] };
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
  decorate: {
    default: [
      function (doc) {
        return doc;
      },
      function (doc) {
        return doc;
      },
    ],
  },
});

userRouter.routeGuard({
  list: true,
  read: true,
  update: true,
  delete: 'isAdmin',
  create: 'isAdmin',
});

userRouter.identifier(function (id) {
  return { name: id };
});

export default userRouter.routes;
