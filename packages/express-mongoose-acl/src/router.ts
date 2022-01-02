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
import { getRootOption, setModelOptions, setModelOption, getModelOptions, getModelSub } from './options';
import { ModelRouterProps, MiddlewareContext } from './interfaces';

JsonRouter.errorMessageProvider = function (error) {
  console.error(error);
  return error.message || error._message || error;
};

const pluralize = mongoose.pluralize();
const clientErrors = JsonRouter.clientErrors;

type setOptionType = (keyOrOption: any, option?: any) => void;

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
  idParam: string;

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

    this.idParam = getRootOption('idParam', 'id');
    this.setCollectionRoutes();
    this.setDocumentRoutes();
    this.setSubDocumentRoutes();
    this.logEndpoints();
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

      const { limit, page, include_permissions = 'true', include_count = 'false', lean = 'false' } = req.query;

      const model = req.macl(this.modelName);
      return model.list({
        limit,
        page,
        options: {
          includePermissions: include_permissions !== 'false',
          includeCount: include_count === 'true',
          lean: lean === 'true',
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
      const { includePermissions = true, includeCount = false, populateAccess = 'read', lean = false } = options;

      const model = req.macl(this.modelName);
      return model.list({
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
          lean,
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
    this.router.get(`${this.basename}/:${this.idParam}`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.idParam];
      const { include_permissions = 'true', try_list = 'true', lean = 'false' } = req.query;
      const model = req.macl(this.modelName);
      return model.read(id, {
        options: {
          includePermissions: include_permissions !== 'false',
          tryList: try_list === 'true',
          lean: lean === 'true',
        },
      });
    });

    //////////////////
    // READ - QUERY //
    //////////////////
    this.router.post(`${this.basename}/__query/:${this.idParam}`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.idParam];
      let { select, populate, options = {} } = req.body;
      const { includePermissions = true, tryList = true, populateAccess = 'read', lean = false } = options;

      const model = req.macl(this.modelName);
      return model.read(id, {
        select,
        populate,
        options: { includePermissions, tryList, populateAccess, lean },
      });
    });

    ////////////
    // UPDATE //
    ////////////
    this.router.put(`${this.basename}/:${this.idParam}`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'update');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.idParam];
      const { returning_all = 'true' } = req.query;

      const model = req.macl(this.modelName);
      return model.update(id, req.body, { returningAll: returning_all === 'true' });
    });

    ////////////
    // DELETE //
    ////////////
    this.router.delete(`${this.basename}/:${this.idParam}`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'delete');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.idParam];
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
      return model.distinct(field);
    });

    this.router.post(`${this.basename}/distinct/:field`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      const { query } = req.body;

      const model = req.macl(this.modelName);
      return model.distinct(field, { query });
    });

    ///////////
    // COUNT //
    ///////////
    this.router.get(`${this.basename}/count`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'count');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const model = req.macl(this.modelName);
      return model.count({});
    });

    this.router.post(`${this.basename}/count`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'count');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { query, access } = req.body;

      const model = req.macl(this.modelName);
      return model.count(query, access);
    });
  }

  /////////////////////////
  // Sub-Document Routes //
  /////////////////////////
  private setSubDocumentRoutes() {
    const subs = getModelSub(this.modelName);

    for (let x = 0; x < subs.length; x++) {
      const sub = subs[x];

      //////////
      // LIST //
      //////////
      this.router.get(`${this.basename}/:${this.idParam}/${sub}`, setGenerators, async (req, res) => {
        const allowed = await req._isAllowed(this.modelName, `subs.${sub}.list`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const model = req.macl(this.modelName);
        return model.listSub(id, sub);
      });

      //////////////////
      // LIST - QUERY //
      //////////////////
      this.router.post(`${this.basename}/:${this.idParam}/${sub}/__query`, setGenerators, async (req, res) => {
        const allowed = await req._isAllowed(this.modelName, `subs.${sub}.list`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const model = req.macl(this.modelName);
        return model.listSub(id, sub, req.body);
      });

      //////////
      // READ //
      //////////
      this.router.get(`${this.basename}/:${this.idParam}/${sub}/:subId`, setGenerators, async (req, res) => {
        const allowed = await req._isAllowed(this.modelName, `subs.${sub}.read`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const { subId } = req.params;
        const model = req.macl(this.modelName);
        return model.readSub(id, sub, subId);
      });

      //////////////////
      // READ - QUERY //
      //////////////////
      this.router.post(`${this.basename}/:${this.idParam}/${sub}/:subId/__query`, setGenerators, async (req, res) => {
        const allowed = await req._isAllowed(this.modelName, `subs.${sub}.read`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const { subId } = req.params;
        const model = req.macl(this.modelName);
        return model.readSub(id, sub, subId, req.body);
      });

      ////////////
      // UPDATE //
      ////////////
      this.router.put(`${this.basename}/:${this.idParam}/${sub}/:subId`, setGenerators, async (req, res) => {
        const allowed = await req._isAllowed(this.modelName, `subs.${sub}.update`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const { subId } = req.params;
        const model = req.macl(this.modelName);
        return model.updateSub(id, sub, subId, req.body);
      });

      ////////////
      // CREATE //
      ////////////
      this.router.post(`${this.basename}/:${this.idParam}/${sub}`, setGenerators, async (req, res) => {
        const allowed = await req._isAllowed(this.modelName, `subs.${sub}.create`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const model = req.macl(this.modelName);
        return model.createSub(id, sub, req.body);
      });

      ////////////
      // DELETE //
      ////////////
      this.router.delete(`${this.basename}/:${this.idParam}/${sub}/:subId`, setGenerators, async (req, res) => {
        const allowed = await req._isAllowed(this.modelName, `subs.${sub}.delete`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const { subId } = req.params;
        const model = req.macl(this.modelName);
        return model.deleteSub(id, sub, subId);
      });
    }
  }

  private logEndpoints() {
    // listEndpoints(this.routes).forEach((endpoint) => {
    //   if (endpoint.path.startsWith(this.basename)) {
    //     console.log(`ACL: ${endpoint.path} (${endpoint.methods.join(', ')})`);
    //   }
    // });
  }

  set(optionKey: string, option: any) {
    setModelOption(this.modelName, optionKey, option);
  }

  listHardLimit: setOptionType = setOption.bind(this, 'listHardLimit');
  permissionSchema: setOptionType = setOption.bind(this, 'permissionSchema');
  permissionField: setOptionType = setOption.bind(this, 'permissionField');
  permissionFields: setOptionType = setOption.bind(this, 'permissionFields');
  docPermissions: setOptionType = setOption.bind(this, 'docPermissions');
  routeGuard: setOptionType = setOption.bind(this, 'routeGuard');
  baseQuery: setOptionType = setOption.bind(this, 'baseQuery');
  decorate: setOptionType = setOption.bind(this, 'decorate');
  decorateAll: setOptionType = setOption.bind(this, 'decorateAll');
  prepare: setOptionType = setOption.bind(this, 'prepare');
  transform: setOptionType = setOption.bind(this, 'transform');
  identifier: setOptionType = setOption.bind(this, 'identifier');
  defaults: setOptionType = setOption.bind(this, 'defaults');

  get options() {
    return getModelOptions(this.modelName);
  }

  get routes() {
    return this.router.original;
  }
}

export default ModelRouter;
