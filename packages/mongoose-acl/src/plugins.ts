import { getModelOption } from './options';

interface Options {
  permissionField?: string;
  modelName: string;
}

export function permissionsPlugin(schema, options: Options) {
  if (!options?.modelName) return;

  schema.virtual(options?.permissionField || 'permissions').get(function () {
    const docPermissionField = getModelOption(options.modelName, 'permissionField', '_permissions');
    return this._doc[docPermissionField];
  });
}
