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
import { getGlobalOption, setModelOptions, setModelOption, getModelOptions } from './options';
import { getModelSub } from './meta';
import { RootRouterProps, ModelRouterProps, Validation, RootQueryEntry } from './interfaces';
import { isArray } from 'lodash';

JsonRouter.errorMessageProvider = function (error) {
  console.error(error);
  return error.message || error._message || error;
};

const pluralize = mongoose.pluralize();
const clientErrors = JsonRouter.clientErrors;

type setOptionType = {
  (option: any): void;
  (key: string, option: any): void;
};

function setOption(parentKey: string, optionKey: any, option?: any) {
  const key = isUndefined(option) ? parentKey : `${parentKey}.${optionKey}`;
  const value = isUndefined(option) ? optionKey : option;

  setModelOption(this.modelName, key, value);
}

const parseBooleanString = (str: string, defaultValue?: any) => (str ? str === 'true' : defaultValue);

const defaultModelOptions = {
  listHardLimit: 1000,
  permissionField: '_permissions',
  mandatoryFields: [],
  identifier: '_id',
};

export class ModelRouter {
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

    this.idParam = getGlobalOption('idParam', 'id');
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

      const { limit, page, include_permissions, include_count, lean } = req.query;

      const model = req._macl(this.modelName);
      return model.list({
        limit,
        page,
        options: {
          includePermissions: parseBooleanString(include_permissions),
          includeCount: parseBooleanString(include_count),
          lean: parseBooleanString(lean),
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
      const { includePermissions, includeCount, populateAccess, lean } = options;

      const model = req._macl(this.modelName);
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

      const { include_permissions } = req.query;

      const model = req._macl(this.modelName);
      const doc = await model.create(req.body, { includePermissions: parseBooleanString(include_permissions) });

      res.status(201).json(doc);
    });

    /////////////////
    // NEW - EMPTY //
    /////////////////
    this.router.get(`${this.basename}/new`, setGenerators, async (req, res) => {
      const model = req._macl(this.modelName);
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
      const { include_permissions, try_list, lean } = req.query;
      const model = req._macl(this.modelName);
      return model.read(id, {
        options: {
          includePermissions: parseBooleanString(include_permissions),
          tryList: parseBooleanString(try_list),
          lean: parseBooleanString(lean),
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
      const { includePermissions, tryList, populateAccess, lean } = options;

      const model = req._macl(this.modelName);
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
      const { returning_all } = req.query;

      const model = req._macl(this.modelName);
      return model.update(id, req.body, { returningAll: parseBooleanString(returning_all) });
    });

    ////////////
    // DELETE //
    ////////////
    this.router.delete(`${this.basename}/:${this.idParam}`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'delete');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.idParam];
      const model = req._macl(this.modelName);
      return model.delete(id);
    });

    //////////////
    // DISTINCT //
    //////////////
    this.router.get(`${this.basename}/distinct/:field`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      const model = req._macl(this.modelName);
      return model.distinct(field);
    });

    this.router.post(`${this.basename}/distinct/:field`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      const { query } = req.body;

      const model = req._macl(this.modelName);
      return model.distinct(field, { query });
    });

    ///////////
    // COUNT //
    ///////////
    this.router.get(`${this.basename}/count`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'count');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const model = req._macl(this.modelName);
      return model.count({});
    });

    this.router.post(`${this.basename}/count`, setGenerators, async (req, res) => {
      const allowed = await req._isAllowed(this.modelName, 'count');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { query, access } = req.body;

      const model = req._macl(this.modelName);
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
        const model = req._macl(this.modelName);
        return model.listSub(id, sub);
      });

      //////////////////
      // LIST - QUERY //
      //////////////////
      this.router.post(`${this.basename}/:${this.idParam}/${sub}/__query`, setGenerators, async (req, res) => {
        const allowed = await req._isAllowed(this.modelName, `subs.${sub}.list`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const model = req._macl(this.modelName);
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
        const model = req._macl(this.modelName);
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
        const model = req._macl(this.modelName);
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
        const model = req._macl(this.modelName);
        return model.updateSub(id, sub, subId, req.body);
      });

      ////////////
      // CREATE //
      ////////////
      this.router.post(`${this.basename}/:${this.idParam}/${sub}`, setGenerators, async (req, res) => {
        const allowed = await req._isAllowed(this.modelName, `subs.${sub}.create`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const model = req._macl(this.modelName);
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
        const model = req._macl(this.modelName);
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

  /**
   * The maximum limit of the number of documents returned from the `list` operation.
   */
  public listHardLimit: setOptionType = setOption.bind(this, 'listHardLimit');

  /**
   * The object schema to define the access control policy for each model field.
   */
  public permissionSchema: setOptionType = setOption.bind(this, 'permissionSchema');

  /**
   * The object field to store the document permissions.
   */
  public permissionField: setOptionType = setOption.bind(this, 'permissionField');

  /**
   * The essential model fields involved in generating document permissions.
   */
  public mandatoryFields: setOptionType = setOption.bind(this, 'mandatoryFields');

  /**
   * The function called in the process of generating document permissions.
   */
  public docPermissions: setOptionType = setOption.bind(this, 'docPermissions');

  /**
   * The access control policy for CRUDL endpoints.
   * @operation `create`, `list`, `read`, `update`, `delete`
   */
  public routeGuard: setOptionType = setOption.bind(this, 'routeGuard');

  /**
   * The base query definitions applied in every query transaction.
   * @operation `list`, `read`, `update`, `delete`
   */
  public baseQuery: setOptionType = setOption.bind(this, 'baseQuery');

  /**
   * Middleware
   *
   * The function called before a new/update document data is processed in `prepare` hooks. This method is used to validate `write data` and throw an error if not valid.
   * @operation `create`, `update`
   */
  public validate: setOptionType = setOption.bind(this, 'validate');

  /**
   * Middleware
   *
   * The function called before a new document is created or an existing document is updated. This method is used to process raw data passed into the API endpoints.
   * @operation `create`, `update`
   */
  public prepare: setOptionType = setOption.bind(this, 'prepare');

  /**
   * Middleware
   *
   * The function called before an updated document is saved.
   * @operation `update`
   */
  public transform: setOptionType = setOption.bind(this, 'transform');

  /**
   * Middleware
   *
   * The function called before response data is sent. This method is used to process raw data to apply custom logic before sending the result.
   * @operation `list`, `read`, `create`, `update`
   */
  public decorate: setOptionType = setOption.bind(this, 'decorate');

  /**
   * Middleware
   *
   * The function are called before response data is sent and after `decorate` middleware runs. This method is used to process and filter multiple document objects before sending the result.
   * @operation `list`
   */
  public decorateAll: setOptionType = setOption.bind(this, 'decorateAll');

  /**
   * The document selector definition with the `id` param.
   * @option `string` | `Function`
   * @operation `read`, `update`, `delete`
   */
  public identifier: setOptionType = setOption.bind(this, 'identifier');

  /**
   * The default values used when missing in the operations.
   */
  public defaults: setOptionType = setOption.bind(this, 'defaults');

  get options() {
    return getModelOptions(this.modelName);
  }

  get routes() {
    return this.router.original;
  }
}

export class RootRouter {
  router: JsonRouter;
  basename: string;
  routeGuard: Validation;

  constructor(options: RootRouterProps = { baseUrl: '', routeGuard: true }) {
    const { baseUrl, routeGuard } = options;

    this.router = new JsonRouter();
    this.basename = baseUrl || '';
    this.routeGuard = routeGuard;
    this.setRoutes();
  }

  private setRoutes() {
    this.router.post(`${this.basename}/__query`, setGenerators, async (req, res) => {
      const allowed = await req._canActivate(this.routeGuard);
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const items = req.body || [];
      return Promise.all(
        items.map((item: RootQueryEntry) => {
          if (!['list', 'create', 'empty', 'read', 'update', 'delete', 'distinct', 'count'].includes(item.operation))
            return null;

          const model = req._macl(item.modelName);
          const op = model[item.operation].bind(model);
          return isArray(item.arguments) ? op(...item.arguments) : op(item.arguments);
        }),
      );
    });
  }

  get routes() {
    return this.router.original;
  }
}
