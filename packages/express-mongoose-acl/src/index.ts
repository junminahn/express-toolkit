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

const defaultModelOptions = { listHardLimit: 1000, permissionField: '_permissions' };

class ModelRouter {
  modelName: string;
  options: ModelRouterProps;
  router: JsonRouter;
  model: Model;
  basename: string;

  constructor(modelName: string, options: ModelRouterProps) {
    this.modelName = modelName;
    this.options = { ...defaultModelOptions, ...options };

    setModelOptions(modelName, options);

    const { baseUrl } = this.options;

    this.router = new JsonRouter();
    this.model = new Model(modelName);

    if (baseUrl === false) {
      this.basename = '';
    } else if (isNil(baseUrl)) {
      this.basename = `/${pluralize(modelName)}`;
    } else {
      this.basename = baseUrl;
    }

    this.setCollectionRoutes();
    this.setDocumentRoutes();
  }

  ///////////////////////
  // Collection Routes //
  ///////////////////////
  setCollectionRoutes() {
    //////////
    // LIST //
    //////////
    this.router.get(`${this.basename}`, setGenerators, async (req, res) => {
      const { limit, page } = req.query;

      const [query, select, pagination] = await Promise.all([
        req._genQuery(this.modelName, 'list'),
        req._genSelect(this.modelName, 'list'),
        req._genPagination({ limit, page }, this.options.listHardLimit),
      ]);

      let docs = await this.model.find({ query, select, ...pagination });
      docs = await Promise.all(
        docs.map(async (doc) => {
          doc = await req._permit(this.modelName, doc, 'list');
          return req._decorate(this.modelName, doc, 'list');
        }),
      );

      return docs;
    });

    //////////////////
    // LIST - QUERY //
    //////////////////
    this.router.post(`${this.basename}__query`, setGenerators, async (req, res) => {
      let { query, select, sort, populate, limit, page } = req.body;
      let pagination = null;

      [query, select, populate, pagination] = await Promise.all([
        req._genQuery(this.modelName, 'list', query),
        req._genSelect(this.modelName, 'list', select),
        req._genPopulate(this.modelName, 'read', populate),
        req._genPagination({ limit, page }, this.options.listHardLimit),
      ]);

      // prevent populate paths from updating query select fields
      if (select) populate = populate.filter((p) => select.includes(p.path));

      let docs = await this.model.find({ query, select, sort, populate, ...pagination });
      docs = await Promise.all(
        docs.map(async (doc) => {
          doc = await req._permit(this.modelName, doc, 'list');
          return req._decorate(this.modelName, doc, 'list');
        }),
      );

      return docs;
    });

    ////////////
    // CREATE //
    ////////////
    this.router.post(`${this.basename}`, setGenerators, async (req, res) => {
      const isArr = Array.isArray(req.body);
      let arr = isArr ? req.body : [req.body];

      const items = await Promise.all(
        arr.map(async (item) => {
          const data = await req._prepare(this.modelName, item, 'create');
          const allowedFields = await req._genCreatableFields(this.modelName, data);
          return pick(data, allowedFields);
        }),
      );

      let docs = await this.model.create(items);
      docs = await Promise.all(
        docs.map(async (doc) => {
          doc = await req._permit(this.modelName, doc, 'create');
          return req._decorate(this.modelName, doc, 'create');
        }),
      );

      res.status(201).json(isArr ? items : items[0]);
    });

    /////////////////
    // NEW - EMPTY //
    /////////////////
    this.router.get(`${this.basename}/new`, setGenerators, async (req, res) => {
      return this.model.new();
    });
  }

  /////////////////////
  // Document Routes //
  /////////////////////
  setDocumentRoutes() {
    //////////
    // READ //
    //////////
    this.router.get(`${this.basename}/:id`, setGenerators, async (req, res) => {
      const { id } = req.params;
      const { try_list } = req.query;

      let [query, select] = await Promise.all([
        req._genQuery(this.modelName, 'read', { _id: id }),
        req._genSelect(this.modelName, 'read'),
      ]);

      let doc = await this.model.findOne({ query, select });

      // if not found, try to get the doc with 'list' access
      if (!doc && try_list === 'true') {
        [query, select] = await Promise.all([
          req._genQuery(this.modelName, 'list', { _id: id }),
          req._genSelect(this.modelName, 'list'),
        ]);

        doc = await this.model.findOne({ query, select });
      }

      if (doc) {
        doc = await req._permit(this.modelName, doc, 'read');
        doc = await req._decorate(this.modelName, doc, 'read');
      }

      return doc;
    });

    //////////////////
    // READ - QUERY //
    //////////////////
    this.router.get(`${this.basename}__query/:id`, setGenerators, async (req, res) => {
      const { id } = req.params;
      const { try_list } = req.query;
      let { select, populate } = req.body;
      let query = null;

      [query, select, populate] = await Promise.all([
        req._genQuery(this.modelName, 'read', { _id: id }),
        req._genSelect(this.modelName, 'read', select),
        req._genPopulate(this.modelName, 'read', populate),
      ]);

      let doc = await this.model.findOne({ query, select, populate });

      // if not found, try to get the doc with 'list' access
      if (!doc && try_list === 'true') {
        [query, select] = await Promise.all([
          req._genQuery(this.modelName, 'list', { _id: id }),
          req._genSelect(this.modelName, 'list', select),
        ]);

        doc = await this.model.findOne({ query, select, populate });
      }

      if (doc) {
        doc = await req._permit(this.modelName, doc, 'read');
        doc = await req._decorate(this.modelName, doc, 'read');
      }

      return doc;
    });

    ////////////
    // UPDATE //
    ////////////
    this.router.put(`${this.basename}/:id`, setGenerators, async (req, res) => {
      const { id } = req.params;
      let query = await req._genQuery(this.modelName, 'update', { _id: id });
      let doc = await this.model.findOne({ query });
      if (!doc) throw new clientErrors.UnauthorizedError();

      doc = await req._permit(this.modelName, doc, 'update');
      const data = await req._prepare(this.modelName, req.body, 'update');
      const allowedFields = await req._genEditableFields(this.modelName, doc);

      Object.assign(doc, pick(data, allowedFields));

      doc = await req._transform(this.modelName, doc, 'update');
      doc = await doc.save();
      doc = await req._decorate(this.modelName, doc, 'update', true);

      return doc;
    });

    ////////////
    // DELETE //
    ////////////
    this.router.delete(`${this.basename}/:id`, setGenerators, async (req, res) => {
      const { id } = req.params;
      let query = await req._genQuery(this.modelName, 'delete', { _id: id });
      let doc = await this.model.findOneAndRemove(query);
      if (!doc) throw new clientErrors.UnauthorizedError();

      return true;
    });
  }

  get routes() {
    return this.router.original;
  }
}

export default ModelRouter;
