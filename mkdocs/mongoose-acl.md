# Mongoose ACL

`express-mongoose-acl` exposes REST API endpoints corresponding to mongoose data models in Express routes. It builds the backend database security layer by decorating mongoose queries, which enables dynamic frontend mongoose-like query options.

![NPM](https://img.shields.io/npm/v/express-mongoose-acl.svg)

## Motivation

REST (Representational State Transfer) is an API protocol which was introduced in a 2000, and is one of major API standards today.
Besides its many benefits, there are also disadvantages to RESTful APIs. One of the disadvantages is that there is no good solution to manage object data at a fine-grained level unless opening up more API endpoints.

Let's say we have a `User` model contains following fields:

    - name
    - address
    - roles
    - creditBalance
    - loginDate

- `GET /users/{id}` to retrieve an user entity identified by user ID

  By making a request to this endpoint, it will return the user's data including the 6 fields above. What if we want to allow selected fields depending on the requester's roles on the system? `admin` and `member`. Probably, we will include conditional logic at the backend to exclude fields that `non-admin` is not allowed to read. But, does it actually solve the cases we will have when building a web application? Even though `admin` is permitted to read all fields of the entity, some fields could be redundant for certain screens.

  To retrieve selected fields only, we might send more information to the API call, such as `GET /users/{id}?include=partial[|all]`. However, this approach will make the backend codebase messy soon as more screens require diffrent entity fields and more backend conditional logic to handle all possible cases.

- `PUT /users/{id}` to update an user entity identified by user ID

  Typically, `UPDATE` endpoint contains more complicated logic to prevent unwanted updates by wrong user types. For example, there might be a case that `admin` can update the first 5 fields while the user itself can update the first 3 fields only. If handling each scenario at the backend codebase, it will be inevitable to have multiple conditional logic depends on the complexity of the user types and the entity relationships.

## Concept

The idea is to build a security boundary defined in a schema for each resource to be consumed at the backend routes; because this security layer works as a wrapper around the request information sent by the browser, it gives the frontend codebase the most flexibility to build queries and manage data within the given API endpoints by the library.

Object permissions are checked if global permissions pass and define whether a user has the ability to perform a specific action on a single object. These are also known as row level permissions.

- Global Permissions

  Global permissions are system-wide and granted to authenticated users based on their roles and allow `role-based access control (RBAC)` to the backend system. Global permissions are expected in `Express request object` (e.g. `req._permissions`) and used to apply access control to the system and resources.

- Document Permissions

  Document permissions are object-level privileges and defined to allow performing specific actions on a single `Mongoose document`.

- Role-based Security

- Document-level Security

- Field-level security

- Base Query

  Base queries are generated to decoreate `Mongoose Query object` to apply global permissions to a target collection.

- Mongoose Query Syntax

  Library API endpoints take a similar request structure as `Mongoose Syntax`, e.g. query, select, and populate, to reduce the learning curve of a new tool.

## Installation

```sh
$ npm install express-mongoose-acl
```

```sh
$ yarn add express-mongoose-acl
```

## Quick Start

### Global Permissions

`Global Permissions` are fundamental elements of `role-based access control (RBAC)` to the backend API endpoints.

```ts
// create Mongoose models beforehand
import macl from 'express-mongoose-acl';

macl.set('globalPermissions', function (req) {
  const user = req.user;

  if (!user) return { isGuest: true };

  return {
    isGuest: false,
    isAdmin: user.roles.includes('admin'),
    isManager: user.roles.includes('manager'),
  };
});
```

It will set the global permission object to Express request object; `request._permissions`.
To change the `permission field name`, update the global option `permissionField`:

```ts
macl.set('permissionField', 'mypermissions');
```

### Model Router

To create pre-defined Express routes binding to a Mongoose model, simply create a model router:

```ts
const userRouter = macl.createRouter('User', { baseUrl: 'users' });
```

The first argument must match a Mongoose model name created beforehand.

### Route Guard

Route Guard applies `role-based security` and restricts access to the backend API endpoints based on the global permissions.
The available routes are `Create`, `Read`, `Update`, `Delete`, and `List` (CRUDL); it only allows API requests with valid checks and excludes the omitted routes.
There is more than one way to validate the access:

- `boolean`: true | false
- `string`: valid if the key returns true in the global permissions
- `array`: valid if any of the keys returns true in the global permissions
- `function`: valid if the function returns true

```ts
userRouter.routeGuard({
  list: true,
  read: ['isAdmin', 'isManager'],
  update: 'isAdmin',
  create: function (globalPermissions) {
    // `this` refers to Express request object
    if (globalPermissions.isAdmin) return true;
    return false;
  },
  delete: false,
});
```

### Base Query

Base Query applies `document-level security` to control access to individual documents in a collection.
It decorates Mongoose Query object to define the permission guardrails based on the global permissions.

```ts
userRouter.baseQuery({
  list: function (permissions: Permissions) {
    return true;
  },
  read: function (permissions: Permissions) {
    if (permissions.isAdmin) return {};
    else return { $or: [{ _id: this.user._id }, { roles: 'user' }] };
  },
  update: function (permissions: Permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: this.user._id };
  },
  delete: function (permissions: Permissions) {
    return permissions.isAdmin;
  },
});
```

For example, in the case of non-admin updating the user of ID `123456`, it will generate a query as below behind the scenes:

```ts
const query = { $and: [{ _id: this.user._id }, { _id: '123456' }] };
const result = await mongoose.model('User').findOne(query);
```

### Permission Schema

`Permission schema` defines the fine-grained resource control mapping based on the global and optional document permissions.
It applies `field-level security` to control access to individual fields within a document while `Base Query` works in `document-level security`.
If no field-level security rule is defined for a field, the field is protected by all actions, `list`, `read`, `update` and `create`.

```ts
userRouter.permissionSchema({
  name: { list: true, read: true, update: 'edit.name', create: true },
  roles: {
    list: ['isAdmin', 'isManager'],
    read: 'isAdmin',
    update: function (permissions: Permissions, docPermissions) {
      // `this` refers to Express request object
      if (docPermissions['edit.roles']) return true;
      return false;
    },
    create: 'isAdmin',
  },
});
```

- global permissions are available in all actions.
- document permissions are also available in `update` and `create` actions; for example, `edit.name` is a document permission generated by the router option `docPermissions`.

### Document Permissions

`Document permissions` play a key role for `field-level security` and available in applicable middleware hooks. You can also find the document permissions in the frontend application and apply business logic in UI based on the permissions generated for the user.

```ts
userRouter.docPermissions(function (docOrObject, permissions: Permissions) {
  const isMe = String(docOrObject._id) === String(this.user._id);

  return {
    'edit.name': permissions.isAdmin || isMe,
    'edit.roles': permissions.isAdmin,
  };
});
```

## Middleware

### Validate

`Validate` hooks are called before a new/update document data is processed in `prepare` hooks. This method is used to validate `write data` and throw an error if not valid; available in `create` and `update` operations.

```ts
userRouter.validate({
  create: function (docObject, permissions, context) {
    // add create validate logic
    const validated = validate(docObject);
    return validated;
  },
  update: function (docObject, permissions, context) {
    // add update validate logic
    const validated = validate(docObject);
    return validated;
  },
});
```

or define individual hooks.

```ts
userRouter.validate('create', function (docObject, permissions, context) {
  // add create validate logic
  const validated = validate(docObject);
  return validated;
});
```

### Prepare

`Prepare` hooks are called before a new document is created or an existing document is updated. This method is used to process raw data passed into the API endpoints; available in `create` and `update` operations.

```ts
userRouter.prepare({
  create: function (docObject, permissions, context) {
    // add create prepare logic
    const processed = process(docObject);
    return processed;
  },
  update: function (docObject, permissions, context) {
    // add update prepare logic
    const processed = process(docObject);
    return processed;
  },
});
```

or define individual hooks.

```ts
userRouter.prepare('create', function (docObject, permissions, context) {
  // add create prepare logic
  const processed = process(docObject);
  return processed;
});
```

### Transform

`Transform` hook is called before an updated document is saved. This method is only available in `update` operation.

```ts
userRouter.transform(function (doc, permissions, context) {
  // add transform logic
  const processed = process(doc);
  return processed;
});
```

### Decorate

`Decorate` hooks are called before response data is sent. This method is used to process raw data to apply custom logic before sending the result; available in `list`, `read`, `create`, `update` operations.

```ts
userRouter.decorate({
  list: function (docObject, permissions, context) {
    // add list decorate logic
    const processed = process(docObject);
    return processed;
  },
  read: function (docObject, permissions, context) {
    // add read decorate logic
    const processed = process(docObject);
    return processed;
  },
  create: function (docObject, permissions, context) {
    // add create decorate logic
    const processed = process(docObject);
    return processed;
  },
  update: function (docObject, permissions, context) {
    // add update decorate logic
    const processed = process(docObject);
    return processed;
  },
});
```

or define individual hooks.

```ts
userRouter.decorate('list', function (docObject, permissions, context) {
  // add list decorate logic
  const processed = process(docObject);
  return processed;
});
```

### Decorate All

`Decorate All` hooks are called before response data is sent and after `decorate` middleware runs. This method is used to process and filter multiple document objects before sending the result; available in `list` operations only.

```ts
userRouter.decorateAll(function (docObjects, permissions) {
  // add process logic
  const processed = process(docObjects);
  return processed;
});
```

## Workflow lifecycle

#### List

`List` operation executes hook methods in the following sequence:

| Hook             | Parameters                                                                                                  | Description                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `docPermissions` | <ol><li>Mongoose document</li><li>global permissions</li></ol>                                              | called after Mongoose execute the query; it runs on each document. |
| `decorate`       | <ol><li>plain document object</li><li>global permissions</li><li>context object: `docPermissions`</li></ol> | runs on each document object.                                      |
| `decorateAll`    | <ol><li>plain document objects</li><li>global permissions</li></ol>                                         | runs on set of document objects.                                   |

#### Read

`Read` operation executes hook methods in the following sequence:

| Hook             | Parameters                                                                                                  | Description                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `docPermissions` | <ol><li>Mongoose document</li><li>global permissions</li></ol>                                              | called after Mongoose execute the query. |
| `decorate`       | <ol><li>plain document object</li><li>global permissions</li><li>context object: `docPermissions`</li></ol> |                                          |

#### Update

`Update` operation executes hook methods in the following sequence:

| Hook             | Parameters                                                                                                                                                                                 | Description                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `docPermissions` | <ol><li>Mongoose document</li><li>global permissions</li></ol>                                                                                                                             | called after Mongoose execute the query. |
| `validate`       | <ol><li>allowed object</li><li>global permissions</li><li>context object: `originalDoc`, `originalData`, `currentDoc`</li></ol>                                                            |                                          |
| `prepare`        | <ol><li>allowed object</li><li>global permissions</li><li>context object: `originalDoc`, `originalData`, `currentDoc`</li></ol>                                                            |                                          |
| `transform`      | <ol><li>allowed object</li><li>global permissions</li><li>context object: `originalDoc`, `originalData`, `currentDoc`, `preparedData`, `modifiedPaths`</li></ol>                           | called before changes saved.             |
| `docPermissions` | <ol><li>Mongoose document</li><li>global permissions</li><li>context object: `originalDoc`, `originalData`, `currentDoc`, `preparedData`, `modifiedPaths`</li></ol>                        | called after changes saved.              |
| `decorate`       | <ol><li>plain document object</li><li>global permissions</li><li>context object: `originalDoc`, `originalData`, `currentDoc`, `preparedData`, `modifiedPaths`, ``docPermissions`</li></ol> |                                          |

#### Create

`Create` operation executes hook methods in the following sequence:

| Hook             | Parameters                                                                                                                | Description                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `validate`       | <ol><li>allowed object</li><li>global permissions</li><li>context object: `originalData`</li><ol>                         |                                  |
| `prepare`        | <ol><li>allowed object</li><li>global permissions</li><li>context object: `originalData`</li></ol>                        |                                  |
| `docPermissions` | <ol><li>Mongoose document</li><li>global permissions</li><li>context object: `originalData`, `preparedData`</li></ol>     | called after a document created. |
| `decorate`       | <ol><li>plain document object</li><li>global permissions</li><li>context object: `originalData`, `preparedData`</li></ol> |                                  |

## API Endpoints

#### List (GET)

#### List (POST)

#### Create (POST)

#### New (GET)

#### Read (GET)

#### Read (POST)

#### Update (PUT)

#### Delete (DELETE)

#### Distinct (GET)

#### Distinct (POST)

#### Count (GET)

#### Count (POST)

## Usage

```ts
import mongoose from 'mongoose';
import express from 'express';
import macl from 'express-mongoose-acl';
import { Permissions } from 'express-mongoose-acl/permission';
const router = express.Router();

mongoose.model(
  'User',
  new mongoose.Schema({
    name: { type: String },
    address: { type: String },
    roles: { type: String },
    creditBalance: { type: Number },
    loginDate: { type: Date },
  }),
);

macl.set('globalPermissions', function (req) {
  const user = req.user;

  if (!user) return { isGuest: true };

  return {
    isGuest: false,
    isAdmin: user.roles.includes('admin'),
    isManager: user.roles.includes('manager'),
  };
});

const userRouter = macl.createRouter('User', { baseUrl: null });

userRouter.routeGuard({
  list: true,
  read: ['isAdmin', 'isManager'],
  update: 'isAdmin',
  create: function (permissions: Permissions) {
    // `this` refers to Express request object
    if (permissions.isAdmin) return true;
    return false;
  },
  delete: false,
});

userRouter.baseQuery({
  list: function (permissions: Permissions) {
    return true;
  },
  read: function (permissions: Permissions) {
    if (permissions.isAdmin) return {};
    else return { $or: [{ _id: this.user._id }, { role: ['user'] }] };
  },
  update: function (permissions: Permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: this.user._id };
  },
  delete: function (permissions: Permissions) {
    return permissions.isAdmin;
  },
});

userRouter.permissionSchema({
  name: { list: true, read: true, update: 'edit.name', create: true },
  roles: {
    list: ['isAdmin', 'isManager'],
    read: 'isAdmin',
    update: function (permissions: Permissions, docPermissions) {
      // `this` refers to Express request object
      if (docPermissions['edit.roles']) return true;
      return false;
    },
    create: 'isAdmin',
  },
});

userRouter.docPermissions(function (docOrObject, permissions: Permissions) {
  const isMe = String(docOrObject._id) === String(this.user._id);

  return {
    'edit.name': permissions.isAdmin || isMe,
    'edit.roles': permissions.isAdmin,
  };
});

userRouter.prepare({
  create: function (docObject, permissions: Permissions, context) {
    const { originalData } = context;
    // add create prepare function
    return docObject;
  },
  update: function (docObject, permissions: Permissions, context) {
    const { originalDoc, originalData, currentDoc } = context;
    // add update prepare function
    return docObject;
  },
});

userRouter.transform(function (doc, permissions: Permissions, context) {
  const { originalDoc, originalData, currentDoc, preparedData, modifiedPaths } = context;
  // add transform function
  return doc;
});

userRouter.decorate({
  list: function (docObject, permissions: Permissions, context) {
    const { docPermissions } = context;
    // add list decorator function
    return docObject;
  },
  read: function (docObject, permissions: Permissions, context) {
    const { docPermissions } = context;
    // add read decorator function
    return docObject;
  },
  create: function (docObject, permissions: Permissions, context) {
    const { originalData, preparedData, docPermissions } = context;
    // add create decorator function
    return docObject;
  },
  update: function (docObject, permissions: Permissions, context) {
    const { originalDoc, originalData, currentDoc, preparedData, modifiedPaths, docPermissions } = context;
    // add update decorator function
    return docObject;
  },
});

userRouter.decorateAll(function (docObjects, permissions: Permissions) {
  // add decorator-all function
  return docObjects;
});

userRouter.identifier(function (id) {
  return { name: id };
});

router.use('/api/users', userRouter.routes);
```

## Model Router Options

Router options can be set passed to the instance constructor or to the each setter methods.

- `baseUrl`
- `listHardLimit`
- `permissionSchema`: see [`Quick Start - Permission Schema`](#permission-schema)
- `permissionField`
- `permissionFields`
- `docPermissions`: see [`Quick Start - Document Permissions`](#document-permissions)
- `routeGuard`: see [`Quick Start - Route Guard`](#route-guard)
- `baseQuery`: see [`Quick Start - Base Query`](#base-query)
- `validate`: see [`Middleware - Validate`](#validate)
- `prepare`: see [`Middleware - Prepare`](#prepare)
- `transform`: see [`Middleware - Transform`](#transform)
- `decorate`: see [`Middleware - Decorate`](#decorate)
- `decorateAll`: see [`Middleware - Decorate All`](#decorate-all)
- `identifier`: this option defines how `id param` is used to find the target document, defaults to `_id` field; there is more than one way to define the relation:

      - `string`: Mongoose document field key
      - `function`: Function returns a Mongoose query to find the target document.

```ts
userRouter.identifier(function (id) {
  return { $or: [{ _id: id }, { code: id }] };
});
```
