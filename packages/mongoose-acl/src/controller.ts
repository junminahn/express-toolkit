import get from 'lodash/get';
import pick from 'lodash/pick';
import isNil from 'lodash/isNil';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import isBoolean from 'lodash/isBoolean';
import isString from 'lodash/isString';
import isMatch from 'lodash/isMatch';
import filter from 'lodash/filter';
import compact from 'lodash/compact';
import flatten from 'lodash/flatten';
import Model from './model';
import { setModelOptions, setModelOption, getModelOptions } from './options';
import { normalizeSelect, iterateQuery, CustomError } from './helpers';
import {
  ModelRouterProps,
  MiddlewareContext,
  SubPopulate,
  ListProps,
  ReadProps,
  CreateOptionProps,
  UpdateOptionProps,
  DistinctOptionProps,
  Defaults,
  Populate,
  FindOneOptionProps,
  FindOneProps,
  FindByIdProps,
} from './interfaces';

class Controller {
  req: any;
  modelName: string;
  model: Model;
  options: ModelRouterProps;
  defaults: Defaults;

  constructor(req: any, modelName: string) {
    this.req = req;
    this.modelName = modelName;
    this.model = new Model(modelName);
    this.options = getModelOptions(modelName);
    this.defaults = this.options.defaults || {};
  }

  protected async findOne({
    query: _query = {},
    select: _select = this.defaults.findOne?.select,
    populate: _populate = this.defaults.findOne?.populate,
    options = this.defaults.findOne?.options || {},
    overrides = {},
  }: FindOneProps = {}) {
    const { includePermissions = true, access = 'read', populateAccess, lean = false } = options;
    const { query: __query, select: __select, populate: __populate } = overrides;

    let [query, select, populate] = await Promise.all([
      __query || this.req._genQuery(this.modelName, access, _query),
      __select || this.req._genSelect(this.modelName, access, _select),
      __populate || this.req._genPopulate(this.modelName, populateAccess || access, _populate),
    ]);

    if (query === false) return null;

    let doc = await this.model.findOne({ query, select, populate, lean });
    if (!doc) return null;

    if (includePermissions) doc = await this.req._permit(this.modelName, doc, access);
    return doc;
  }

  protected async findById(
    id,
    {
      select: _select = this.defaults.findOne?.select,
      populate: _populate = this.defaults.findOne?.populate,
      options = this.defaults.findOne?.options || {},
      overrides = {},
    }: FindByIdProps = {},
  ) {
    const { select: __select, populate: __populate, idQuery: __idQuery } = overrides;
    const query = __idQuery || (await this.req._genIDQuery(this.modelName, id));

    return this.findOne({
      query,
      select: _select,
      populate: _populate,
      options,
      overrides: {
        select: __select,
        populate: __populate,
      },
    });
  }
}

export default Controller;
