import mongoose from 'mongoose';
import get from 'lodash/get';
import { buildRefs, buildSubPaths } from './helpers';

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

export const getModelRef = (modelName: string, refPath: string) => get(modelRefs, `${modelName}.${refPath}`, null);
export const getModelSub = (modelName: string) => get(modelSubs, modelName, []);
