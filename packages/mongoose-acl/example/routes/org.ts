import macl from '../../src';
import { Permissions } from '../../src/permission';

export const orgRouter = macl.createRouter('Org', {
  baseUrl: null,
  permissionSchema: { name: { list: true, read: true, create: true } },
  docPermissions: () => {
    return { read: false, edit: true };
  },
});

orgRouter.prepare(function (data) {
  return data;
});

orgRouter.baseQuery({
  list: function (permissions: Permissions) {
    return true;
  },
  read: function (permissions: Permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: this._user.orgs };
  },
  update: function (permissions: Permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: this._user.orgs };
  },
  delete: function (permissions: Permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: this._user.orgs };
  },
});

orgRouter.routeGuard({
  list: true,
  read: true,
  update: true,
  delete: false,
  create: 'isAdmin',
});

export default orgRouter.routes;
