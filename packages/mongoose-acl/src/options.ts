import mongoose from 'mongoose';
import get from 'lodash/get';
import set from 'lodash/set';
import reduce from 'lodash/reduce';
import { buildRefs, buildSubPaths } from './helpers';
import { ModelRouterProps } from './interfaces';

export interface GlobalOptions {
  permissionField?: string;
  idParam?: string;
  globalPermissions?: () => any;
}

const defaultGlobalOptions: GlobalOptions = {
  permissionField: '_permissions',
  idParam: 'id',
  globalPermissions: () => ({}),
};

let currentGlobalOptions = { ...defaultGlobalOptions };
let modelOptions = {};

export const setGlobalOptions = (options: GlobalOptions) => {
  currentGlobalOptions = { ...defaultGlobalOptions, ...currentGlobalOptions, ...options };
};

export const setGlobalOption = (optionKey: string, value: any) => {
  set(currentGlobalOptions, optionKey, value);
};

export const getGlobalOption = (optionKey: string, defaultValue?: any) =>
  get(currentGlobalOptions, optionKey, defaultValue);

const updateModelOptions = (modelName: string) => {
  const options = modelOptions[modelName];
  if (!options) return;

  if (options.permissionSchema) {
    options['permissionSchemaKeys'] = Object.keys(options.permissionSchema);
  }
};

export const setModelOptions = (modelName: string, options: ModelRouterProps) => {
  modelOptions[modelName] = options;
  updateModelOptions(modelName);
};

export const setModelOption = (modelName: string, optionKey: string, option: any) => {
  if (!modelOptions[modelName]) modelOptions[modelName] = {};

  set(modelOptions[modelName], optionKey, option);
  updateModelOptions(modelName);
};

export const getModelOptions = (modelName: string) => {
  return get(modelOptions, modelName, {});
};
export const getModelOption = (modelName: string, optionKey: string, defaultValue?: any) => {
  const keys = optionKey.split('.');
  if (keys.length === 1) return get(modelOptions, `${modelName}.${optionKey}`, defaultValue);

  let option = get(modelOptions, `${modelName}.${optionKey}`, undefined);
  if (option) return option;

  const parentKey = keys.slice(0, -1).join('.');
  option = get(modelOptions, `${modelName}.${parentKey}.default`);
  if (option === undefined) option = get(modelOptions, `${modelName}.${parentKey}`, defaultValue);
  return option;
};
