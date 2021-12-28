import { Request, Response, NextFunction } from 'express';
import { setGenerators } from './generators';

export default function macl() {
  return async function (req: Request, res: Response, next: NextFunction) {
    await setGenerators(req, res, next);
  };
}
