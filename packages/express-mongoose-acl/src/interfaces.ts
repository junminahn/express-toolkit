export interface ModelRouterProps {
  baseUrl: string | null | undefined | false;
  listHardLimit?: number;
  permissionSchema?: any;
  permissionField?: string;
  docPermissions?: Function;
  routeGuard?: boolean | string | Function;
  baseQuery?: any;
  decorate?: any;
  prepare?: any;
  transform?: any;
}

export interface Populate {
  path: string;
  select?: string[];
  match?: any;
  access?: string;
}
