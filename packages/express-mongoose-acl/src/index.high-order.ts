import mongoose from 'mongoose';
import JsonRouter from 'express-json-router';
import get from 'lodash/get';
import pick from 'lodash/pick';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import intersection from 'lodash/intersection';
import Model from './model';

import { setGenerators } from './generators';
import { setModelOptions } from './options';
import { ModelRouterProps } from './interfaces';

const pluralize = mongoose.pluralize();
const clientErrors = JsonRouter.clientErrors;

export const createModelRouter = (modelName, options: ModelRouterProps) => {
  setModelOptions(modelName, options);

  const { baseUrl, listHardLimit = 1000, permissionField = '_permissions' } = options;

  const router = new JsonRouter();
  const model = new Model(modelName);

  let basename = baseUrl;

  if (baseUrl === false) {
    basename = '';
  } else if (isNil(baseUrl)) {
    basename = `/${pluralize(modelName)}`;
  }

  ///////////////////////
  // Collection Routes //
  ///////////////////////
  //////////
  // LIST //
  //////////
  router.get(`${basename}`, setGenerators, async (req, res) => {
    const { limit, page } = req.query;

    const [query, select, pagination] = await Promise.all([
      req._genQuery(modelName, 'list'),
      req._genSelect(modelName, 'list'),
      req._genPagination({ limit, page }, listHardLimit),
    ]);

    let docs = await model.find({ query, select, ...pagination });
    docs = await Promise.all(docs.map((doc) => req._decorate(modelName, doc, 'list')));

    return docs;
  });

  //////////////////
  // LIST - QUERY //
  //////////////////
  router.post(`${basename}__query`, setGenerators, async (req, res) => {
    let { query, select, sort, populate, limit, page } = req.body;
    let pagination = null;

    [query, select, populate, pagination] = await Promise.all([
      req._genQuery(modelName, 'list', query),
      req._genSelect(modelName, 'list', select),
      req._genPopulate(modelName, 'read', populate),
      req._genPagination({ limit, page }, listHardLimit),
    ]);

    // prevent populate paths from updating query select fields
    if (select) populate = populate.filter((p) => select.includes(p.path));

    let docs = await model.find({ query, select, sort, populate, ...pagination });
    docs = await Promise.all(docs.map((doc) => req._decorate(modelName, doc, 'list')));

    return docs;
  });

  ////////////
  // CREATE //
  ////////////
  router.post(`${basename}`, setGenerators, async (req, res) => {
    let docs = await model.create(req.body);

    docs = Array.isArray(docs)
      ? await Promise.all(docs.map((doc) => req._decorate(modelName, doc, 'create', true)))
      : await req._decorate(modelName, docs, 'create', true);

    res.status(201).json(docs);
  });

  /////////////////
  // NEW - EMPTY //
  /////////////////
  router.get(`${basename}/new`, setGenerators, async (req, res) => {
    return model.new();
  });

  /////////////////////
  // Document Routes //
  /////////////////////
  //////////
  // READ //
  //////////
  router.get(`${basename}/:id`, setGenerators, async (req, res) => {
    const { id } = req.params;
    const { try_list } = req.query;

    let [query, select] = await Promise.all([
      req._genQuery(modelName, 'read', { _id: id }),
      req._genSelect(modelName, 'read'),
    ]);

    let doc = await model.findOne({ query, select });

    // if not found, try to get the doc with 'list' access
    if (!doc && try_list === 'true') {
      [query, select] = await Promise.all([
        req._genQuery(modelName, 'list', { _id: id }),
        req._genSelect(modelName, 'list'),
      ]);

      doc = await model.findOne({ query, select });
    }

    if (doc) doc = await req._decorate(modelName, doc, 'read');
    return doc;
  });

  //////////////////
  // READ - QUERY //
  //////////////////
  router.get(`${basename}__query/:id`, setGenerators, async (req, res) => {
    const { id } = req.params;
    const { try_list } = req.query;
    let { select, populate } = req.body;
    let query = null;

    [query, select, populate] = await Promise.all([
      req._genQuery(modelName, 'read', { _id: id }),
      req._genSelect(modelName, 'read', select),
      req._genPopulate(modelName, 'read', populate),
    ]);

    let doc = await model.findOne({ query, select, populate });

    // if not found, try to get the doc with 'list' access
    if (!doc && try_list === 'true') {
      [query, select] = await Promise.all([
        req._genQuery(modelName, 'list', { _id: id }),
        req._genSelect(modelName, 'list', select),
      ]);

      doc = await model.findOne({ query, select, populate });
    }

    if (doc) doc = await req._decorate(modelName, doc, 'read');

    return doc;
  });

  ////////////
  // UPDATE //
  ////////////
  router.put(`${basename}/:id`, setGenerators, async (req, res) => {
    const { id } = req.params;
    let query = await req._genQuery(modelName, 'update', { _id: id });
    let doc = await model.findOne({ query });
    if (!doc) throw new clientErrors.UnauthorizedError();

    doc = await req._setDocPermissions(modelName, doc);
    const allowedFields = await req._genEditableFields(modelName, doc);

    Object.assign(doc, pick(req.body, allowedFields));

    doc = await doc.save();
    doc = await req._decorate(modelName, doc, 'update', true);

    return doc;
  });

  ////////////
  // DELETE //
  ////////////
  router.delete(`${basename}/:id`, setGenerators, async (req, res) => {
    const { id } = req.params;
    let query = await req._genQuery(modelName, 'delete', { _id: id });
    let doc = await model.findOneAndRemove(query);
    if (!doc) throw new clientErrors.UnauthorizedError();

    return true;
  });

  return router.original;
};
