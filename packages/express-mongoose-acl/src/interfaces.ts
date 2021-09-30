export interface ModelRouterProps {
  baseUrl: string | null | undefined | false;
  listHardLimit?: number;
  permissionSchema?: any;
  permissionField?: string;
  docPermissions?: Function;
  routeGuard?: boolean | string | Function;
  baseQuery?: any;
  decorate?: any;
  decorateAll?: any;
  prepare?: any;
  transform?: any;
  identifier?: string | Function;
}

export interface Populate {
  path: string;
  select?: string[];
  match?: any;
  access?: string;
}
