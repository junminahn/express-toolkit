# express-mongoose-acl

`express-mongoose-acl` exposes REST API endpoints corresponding to mongoose data models in Express routes. It builds the backend database security layer by decorating mongoose queries, which enables dynamic frontend mongoose-like query options.

![NPM](https://img.shields.io/npm/v/express-mongoose-acl.svg)

## Installation

```sh
$ npm install express-mongoose-acl
```

```sh
$ yarn add express-mongoose-acl
```

## Usage

```js
const macl = require('express-mongoose-acl').default;
const express = require('express');
const router = express.Router();

const userRouter = macl.createRouter('User', { baseUrl: null });

userRouter.permissionSchema({
  name: { list: true, read: true, update: 'edit.name', create: 'isAdmin' },
  role: { list: 'isAdmin', read: true, update: 'edit.role', create: 'isAdmin' },
  public: { list: true, read: true, update: 'edit.public', create: 'isAdmin' },
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
    create: (permissions) => {
      return 'isAdmin';
    },
  },
});

userRouter.docPermissions(function (doc, permissions) {
  const isMe = String(doc._id) === String(permissions.userId);
  const permissions = {
    'edit.name': permissions.isAdmin || isMe,
    'edit.role': permissions.isAdmin,
    'edit.public': permissions.isAdmin,
    'edit.statusHistory': permissions.isAdmin,
  };

  return permissions;
});

userRouter.baseQuery({
  list: function (permissions) {
    if (permissions.isAdmin) return {};
    return { $or: [{ _id: permissions.userId }, { public: true }] };
  },
  read: function (permissions) {
    if (permissions.isAdmin) return {};
    return { _id: permissions.userId };
  },
  update: function (permissions) {
    if (permissions.isAdmin) return {};
    return { _id: permissions.userId };
  },
  delete: function (permissions) {
    if (permissions.isAdmin) return {};
    return { _id: permissions.userId };
  },
});

userRouter.prepare({
  create: function (docObject, permissions, context) {
    const { originalData } = context;
    // add create prepare function
    return docObject;
  },
  update: function (docObject, permissions, context) {
    const { originalDoc, originalData, currentDoc } = context;
    // add update prepare function
    return docObject;
  },
});

userRouter.transform(function (doc, permissions, context) {
  const { originalDoc, originalData, currentDoc, preparedData, modifiedPaths } = context;
  // add transform function
  return doc;
});

userRouter.decorate({
  list: function (docObject, permissions, context) {
    const { modelPermissions } = context;
    // add list decorator function
    return docObject;
  },
  read: function (docObject, permissions, context) {
    const { modelPermissions } = context;
    // add read decorator function
    return docObject;
  },
  create: function (docObject, permissions, context) {
    const { originalData, preparedData, modelPermissions } = context;
    // add create decorator function
    return docObject;
  },
  update: function (docObject, permissions, context) {
    const { originalDoc, originalData, currentDoc, preparedData, modifiedPaths, modelPermissions } = context;
    // add update decorator function
    return docObject;
  },
});

userRouter.decorateAll(function (docObjects, permissions) {
  // add decorator-all function
  return docObjects;
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

router.use('/api/users', userRouter.routes);
```

## Model Router Options

Router options can be set passed to the instance constructor or to the each setter methods.

### baseUrl

### identifier

### permissionSchema

### routeGuard

### baseQuery

### prepare

### transform

### decorate

### decorateAll

### docPermissions

### [MIT Licensed](LICENSE)
