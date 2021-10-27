type ValidationType = boolean | string | Function;

interface Access {
  list?: ValidationType;
  create?: ValidationType;
  read?: ValidationType;
  update?: ValidationType;
  delete?: ValidationType;
  distinct?: ValidationType;
}

interface PermissionSchema {
  [key: string]: Access;
}

interface DocPermissions {
  list?: Function;
  create?: Function;
  read?: Function;
  update?: Function;
}

export interface ModelRouterProps {
  baseUrl: string | null | undefined | false;
  listHardLimit?: number;
  permissionSchema?: PermissionSchema;
  permissionSchemaKeys?: string[];
  permissionField?: string;
  permissionFields?: string[];
  docPermissions?: DocPermissions | Function;
  routeGuard?: ValidationType | Access;
  baseQuery?: any;
  decorate?: any;
  decorateAll?: any;
  prepare?: any;
  transform?: any;
  identifier?: string | Function;
}

export interface Populate {
  path: string;
  select?: string | string[];
  match?: any;
  access?: string;
}

interface keyValue {
  [key: string]: any;
}

export interface MiddlewareContext {
  originalDoc?: keyValue;
  currentDoc?: keyValue;
  originalData?: keyValue;
  preparedData?: keyValue;
  modifiedPaths?: string[];
  modelPermissions?: keyValue;
}
