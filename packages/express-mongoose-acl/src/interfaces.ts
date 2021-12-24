type ValidationType = boolean | string | Function;

interface Access {
  list?: ValidationType;
  create?: ValidationType;
  read?: ValidationType;
  update?: ValidationType;
  delete?: ValidationType;
  distinct?: ValidationType;
  count?: ValidationType;
  sub?: any;
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

export interface CreateOptionProps {
  includePermissions?: boolean;
}

export interface UpdateOptionProps {
  returningAll?: boolean;
}

export interface DistinctOptionProps {
  query?: any;
}

export interface ListOptionProps {
  includePermissions?: boolean;
  includeCount?: boolean;
  populateAccess?: string;
  lean?: boolean;
}

export interface ReadOptionProps {
  includePermissions?: boolean;
  tryList?: boolean;
  populateAccess?: string;
  lean?: boolean;
}

export interface ListProps {
  query?: any;
  select?: string[] | string | null | undefined;
  sort?: string[] | string | null | undefined;
  populate?: Populate[] | string | null | undefined;
  limit?: string | number | null | undefined;
  page?: string | number | null | undefined;
  options?: ListOptionProps;
}

export interface ReadProps {
  select?: string[] | string | null | undefined;
  populate?: Populate[] | string | null | undefined;
  options?: ReadOptionProps;
}

export interface Defaults {
  list?: ListProps;
  create?: CreateOptionProps;
  read?: ReadProps;
  update?: UpdateOptionProps;
  distinct?: DistinctOptionProps;
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
  defaults?: Defaults;
}

interface KeyValueProjection {
  [key: string]: 1 | -1;
}

export type Projection = string[] | string | KeyValueProjection;

export interface Populate {
  path: string;
  select?: Projection;
  match?: any;
  access?: string;
}

export interface SubPopulate {
  path: string;
  select?: Projection;
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
