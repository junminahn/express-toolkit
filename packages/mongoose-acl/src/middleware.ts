import { Request, Response, NextFunction } from 'express';
import JsonRouter from 'express-json-router';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import { setGenerators, PERMISSIONS } from './generators';
import Permission from './permission';
import { createValidator } from './helpers';

export default function macl() {
  return async function (req: Request, res: Response, next: NextFunction) {
    await setGenerators(req, res, next);
  };
}

export const guard = (permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions = req[PERMISSIONS] as Permission;

    const phas = (key) => permissions.has(key);
    const [stringHandler, arrayHandler] = createValidator(phas);

    if (isString(permission)) {
      if (stringHandler(permission)) return next();
    } else if (isArray(permission)) {
      if (arrayHandler(permission)) return next();
    }

    throw new JsonRouter.clientErrors.UnauthorizedError();
  };
};
