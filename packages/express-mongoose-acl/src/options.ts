import mongoose from 'mongoose';
import get from 'lodash/get';
import mapValues from 'lodash/reduce';
import { recurseSchema } from './helpers';
import { ModelRouterProps } from './interfaces';

const modelRefs = {};
const modelNames = Object.keys(mongoose.models);
modelNames.forEach((modelName) => {
  // @ts-ignore
  modelRefs[modelName] = recurseSchema(mongoose.models[modelName].schema.tree);
});

const defaultRootOptions = { permissionField: '_permissions' };
let currentRootOptions = { ...defaultRootOptions };
let modelOptions = {};

export const setOptions = (options) => {
  currentRootOptions = { ...defaultRootOptions, ...currentRootOptions, ...options };
};

export const setModelOptions = (modelName: string, options: ModelRouterProps) => {
  modelOptions[modelName] = options;
  modelOptions[modelName]['permissionSchemaKeys'] = Object.keys(options.permissionSchema);
};

export const getOption = (optionKey: string, defaultValue?: any) => get(currentRootOptions, optionKey, defaultValue);

export const getModelOption = (modelName: string, optionKey: string, defaultValue?: any) => {
  const keys = optionKey.split('.');
  if (keys.length === 0) return get(modelOptions, `${modelName}.${optionKey}`, defaultValue);

  let option = get(modelOptions, `${modelName}.${optionKey}`, undefined);
  if (option === undefined) option = get(modelOptions, `${modelName}.${keys[0]}`, defaultValue);
  return option;
};

export const getModelRef = (modelName: string, refPath: string) => get(modelRefs, `${modelName}.${refPath}`, null);
