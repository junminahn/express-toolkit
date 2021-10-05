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

export interface ModelRouterProps {
  baseUrl: string | null | undefined | false;
  listHardLimit?: number;
  permissionSchema?: PermissionSchema;
  permissionField?: string;
  docPermissions?: Function;
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
