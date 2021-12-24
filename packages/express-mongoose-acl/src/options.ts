import mongoose from 'mongoose';
import get from 'lodash/get';
import set from 'lodash/set';
import reduce from 'lodash/reduce';
import { buildRefs, buildSubPaths } from './helpers';
import { ModelRouterProps } from './interfaces';

const modelRefs = {};
const modelSubs = {};
const modelNames = Object.keys(mongoose.models);
modelNames.forEach((modelName) => {
  // @ts-ignore
  const references = buildRefs(mongoose.models[modelName].schema.tree);
  // @ts-ignore
  const subPaths = buildSubPaths(mongoose.models[modelName].schema.tree);
  modelRefs[modelName] = references;
  modelSubs[modelName] = subPaths;
});

const defaultRootOptions = { permissionField: '_permissions', idParam: 'id', rootPermissions: () => ({}) };
let currentRootOptions = { ...defaultRootOptions };
let modelOptions = {};

export const setRootOptions = (options) => {
  currentRootOptions = { ...defaultRootOptions, ...currentRootOptions, ...options };
};

export const setRootOption = (optionKey, value) => {
  set(currentRootOptions, optionKey, value);
};

export const getRootOption = (optionKey: string, defaultValue?: any) =>
  get(currentRootOptions, optionKey, defaultValue);

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

export const getModelRef = (modelName: string, refPath: string) => get(modelRefs, `${modelName}.${refPath}`, null);
export const getModelSub = (modelName: string) => get(modelSubs, modelName, []);
