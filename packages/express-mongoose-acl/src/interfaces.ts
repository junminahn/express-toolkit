export interface ModelRouterProps {
  baseUrl: string | null | undefined | false;
  listHardLimit?: number;
  permissionSchema?: any;
  permissionField?: string;
  docPermissions?: Function;
  baseQuery?: any;
  decorate?: any;
}

export interface Populate {
  path: string;
  select?: string[];
  match?: any;
  access?: string;
}