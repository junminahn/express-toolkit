import mongoose from 'mongoose';
import JsonRouter from 'express-json-router';
import get from 'lodash/get';
import pick from 'lodash/pick';
import isNil from 'lodash/isNil';
import isUndefined from 'lodash/isUndefined';
import isString from 'lodash/isString';
import intersection from 'lodash/intersection';
import Model from './model';

import { setGenerators } from './generators';
import { setModelOptions, setModelOption, getModelOptions } from './options';
import { ModelRouterProps, MiddlewareContext } from './interfaces';

const pluralize = mongoose.pluralize();
const clientErrors = JsonRouter.clientErrors;

type setOption = (keyOrOption: any, option?: any) => void;

function setOption(parentKey: string, optionKey: any, option?: any) {
  const key = isUndefined(option) ? parentKey : `${parentKey}.${optionKey}`;
  const value = isUndefined(option) ? optionKey : option;

  setModelOption(this.modelName, key, value);
}

const defaultModelOptions = {
  listHardLimit: 1000,
  permissionField: '_permissions',
  permissionFields: [],
  identifier: '_id',
};

class ModelRouter {
  modelName: string;
  router: JsonRouter;
  model: Model;
  basename: string;

  constructor(modelName: string, options: ModelRouterProps) {
    this.modelName = modelName;
    const initOptions = { ...defaultModelOptions, ...options };

    setModelOptions(modelName, initOptions);

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
  private setCollectionRoutes() {
    //////////
    // LIST //
    //////////
    this.router.get(`${this.basename}`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { limit, page, include_permissions = 'true', include_count = 'false' } = req.query;

      const model = req.macl(this.modelName);
      return model.listQuery({
        limit,
        page,
        options: {
          includePermissions: include_permissions !== 'false',
          includeCount: include_count === 'true',
        },
      });
    });

    //////////////////
    // LIST - QUERY //
    //////////////////
    this.router.post(`${this.basename}/__query`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      let { query, select, sort, populate, limit, page, options = {} } = req.body;
      const { includePermissions = true, includeCount = false, populateAccess = 'read' } = options;

      const model = req.macl(this.modelName);
      return model.listQuery({
        query,
        select,
        sort,
        populate,
        limit,
        page,
        options: {
          includePermissions,
          includeCount,
          populateAccess,
        },
      });
    });

    ////////////
    // CREATE //
    ////////////
    this.router.post(`${this.basename}`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'create');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { include_permissions = 'true' } = req.query;

      const model = req.macl(this.modelName);
      const doc = await model.create(req.body, { includePermissions: include_permissions === 'true' });

      res.status(201).json(doc);
    });

    /////////////////
    // NEW - EMPTY //
    /////////////////
    this.router.get(`${this.basename}/new`, setGenerators, async (req, res) => {
      const model = req.macl(this.modelName);
      return model.empty();
    });
  }

  /////////////////////
  // Document Routes //
  /////////////////////
  private setDocumentRoutes() {
    //////////
    // READ //
    //////////
    this.router.get(`${this.basename}/:id`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { id } = req.params;
      const { include_permissions = 'true', try_list = 'true' } = req.query;

      const model = req.macl(this.modelName);
      return model.readQuery(id, {
        options: {
          includePermissions: include_permissions !== 'false',
          tryList: try_list === 'true',
        },
      });
    });

    //////////////////
    // READ - QUERY //
    //////////////////
    this.router.post(`${this.basename}/__query/:id`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { id } = req.params;
      let { select, populate, options = {} } = req.body;
      const { includePermissions = true, tryList = true, populateAccess = 'read' } = options;

      const model = req.macl(this.modelName);
      return model.readQuery(id, {
        select,
        populate,
        options: { includePermissions, tryList, populateAccess },
      });
    });

    ////////////
    // UPDATE //
    ////////////
    this.router.put(`${this.basename}/:id`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'update');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { id } = req.params;

      const model = req.macl(this.modelName);
      return model.update(id, req.body);
    });

    ////////////
    // DELETE //
    ////////////
    this.router.delete(`${this.basename}/:id`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'delete');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { id } = req.params;
      const model = req.macl(this.modelName);
      return model.delete(id);
    });

    //////////////
    // DISTINCT //
    //////////////
    this.router.get(`${this.basename}/distinct/:field`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      const model = req.macl(this.modelName);
      return model.distinctQuery(field);
    });

    this.router.post(`${this.basename}/distinct/:field`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      const { query } = req.body;

      const model = req.macl(this.modelName);
      return model.distinctQuery(field, { query });
    });
  }

  set(optionKey: string, option: any) {
    setModelOption(this.modelName, optionKey, option);
  }

  listHardLimit: setOption = setOption.bind(this, 'listHardLimit');
  permissionSchema: setOption = setOption.bind(this, 'permissionSchema');
  permissionField: setOption = setOption.bind(this, 'permissionField');
  permissionFields: setOption = setOption.bind(this, 'permissionFields');
  docPermissions: setOption = setOption.bind(this, 'docPermissions');
  routeGuard: setOption = setOption.bind(this, 'routeGuard');
  baseQuery: setOption = setOption.bind(this, 'baseQuery');
  decorate: setOption = setOption.bind(this, 'decorate');
  decorateAll: setOption = setOption.bind(this, 'decorateAll');
  prepare: setOption = setOption.bind(this, 'prepare');
  transform: setOption = setOption.bind(this, 'transform');
  identifier: setOption = setOption.bind(this, 'identifier');

  get options() {
    return getModelOptions(this.modelName);
  }

  get routes() {
    return this.router.original;
  }
}

export default ModelRouter;
