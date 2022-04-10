interface BooleanObject {
  [key: string]: boolean;
}

class Permission {
  $_permissions: BooleanObject;
  $_permissionKeys: string[];

  constructor(permissions: BooleanObject) {
    this.$_permissions = permissions;
    this.$_permissionKeys = Object.keys(permissions);

    for (let x = 0; x < this.$_permissionKeys.length; x++) {
      const key = this.$_permissionKeys[x];
      Object.defineProperty(this, key, {
        enumerable: true,
        get: function () {
          return this.has(key);
        },
      });
    }
  }

  prop(permission) {
    return this.$_permissions.hasOwnProperty(permission);
  }

  has(permission) {
    return this.$_permissions[permission] || false;
  }

  hasAny(permissions) {
    return permissions.some((permission) => {
      return this.has(permission);
    });
  }

  hasAll(permissions) {
    return permissions.every((permission) => {
      return this.has(permission);
    });
  }

  any(permissions) {
    return this.hasAny(permissions);
  }

  all(permissions) {
    return this.hasAll(permissions);
  }
}

export default Permission;
export interface Permissions extends Permission {
  [key: string]: any;
}
