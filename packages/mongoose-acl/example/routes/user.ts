import macl from '../../src';
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

export const userRouter = macl.createRouter('User', {
  baseUrl: null,
  permissionSchema: {
    name: { list: true, read: true, update: ['edit.name', 'edit.dummy'], create: true },
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
      sub: {
        name: { list: true, read: true, update: true, create: true },
        approved: { list: true, read: true, update: false, create: true },
        document: { list: false, read: true, update: true, create: true },
      },
    },
    orgs: { list: true, read: true, update: 'edit.orgs' },
  },
  docPermissions: function (doc, permissions) {
    const isMe = String(doc._id) === String(this._user?._id);
    const p = {
      'edit.name': permissions.isAdmin || isMe,
      'edit.role': permissions.isAdmin,
      'edit.public': permissions.isAdmin,
      'edit.statusHistory': permissions.isAdmin,
      'edit.orgs': permissions.isAdmin,
      'test:public': doc.public,
    };

    return p;
  },
  baseQuery: {
    list: function (permissions: Permissions) {
      if (permissions.isAdmin) return {};
      else return { $or: [{ _id: this._user?._id }, { public: true }] };
    },
    read: function (permissions) {
      if (permissions.isAdmin) return {};
      else return { _id: this._user?._id };
    },
    update: function (permissions) {
      if (permissions.isAdmin) return {};
      else return { _id: this._user?._id };
    },
    delete: function (permissions) {
      if (permissions.isAdmin) return {};
      else return { _id: this._user?._id };
    },
    subs: {
      statusHistory: {
        list: (permissions: Permissions) => {
          if (permissions.isAdmin) return {};
          else return { approved: true };
        },
        read: (permissions) => {
          if (permissions.isAdmin) return {};
          else return { approved: true };
        },
        update: (permissions) => {
          if (permissions.isAdmin) return {};
          else return false;
        },
        delete: (permissions) => {
          if (permissions.isAdmin) return {};
          else return false;
        },
      },
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
  create: ['isAdmin', 'dummy'],
  subs: {
    statusHistory: { list: true, read: true, update: true, delete: 'isAdmin', create: 'isAdmin' },
  },
});

userRouter.identifier(function (id) {
  return { name: id };
});

export default userRouter.routes;
