import { Request, Response, NextFunction } from 'express';
import middleware from './middleware';
import ModelRouter from './router';
import { setRootOption, setRootOptions, getRootOption } from './options';
import { ModelRouterProps } from './interfaces';

type Middleware = () => (req: Request, res: Response, next: NextFunction) => Promise<void>;
interface ModelRouterConstructor {
  new (modelName: string, options: ModelRouterProps): ModelRouter;
}

interface MACL {
  createRouter: (modelName: string, options: ModelRouterProps) => ModelRouter;
  setRootOption: (optionKey: string, value: any) => void;
  setRootOptions: (options: any) => void;
  getRootOption: (optionKey: string, defaultValue?: any) => any;
  ModelRouter: ModelRouterConstructor;
}

const macl = middleware as Middleware & MACL;
macl.createRouter = function (modelName: string, options: ModelRouterProps) {
  return new ModelRouter(modelName, options);
};

macl.setRootOption = setRootOption;
macl.setRootOptions = setRootOptions;
macl.getRootOption = getRootOption;
macl.ModelRouter = ModelRouter;

export default macl;
