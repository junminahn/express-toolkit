import { Request, Response, NextFunction } from 'express';
import isNil from 'lodash/isNil';
import middleware from './middleware';
import ModelRouter from './router';
import { setGlobalOption, setGlobalOptions, getGlobalOption, GlobalOptions } from './options';
import { ModelRouterProps } from './interfaces';

type Middleware = () => (req: Request, res: Response, next: NextFunction) => Promise<void>;
interface ModelRouterConstructor {
  new (modelName: string, options: ModelRouterProps): ModelRouter;
}

interface MACL {
  createRouter: (modelName: string, options: ModelRouterProps) => ModelRouter;
  set: (keyOrOptions: string | GlobalOptions, value?: any) => void;
  setGlobalOption: (optionKey: string, value: any) => void;
  setGlobalOptions: (options: GlobalOptions) => void;
  getGlobalOption: (optionKey: string, defaultValue?: any) => any;
  ModelRouter: ModelRouterConstructor;
}

const macl = middleware as Middleware & MACL;
macl.createRouter = function (modelName: string, options: ModelRouterProps) {
  return new ModelRouter(modelName, options);
};

macl.set = (keyOrOptions, value) =>
  isNil(value) ? setGlobalOptions(keyOrOptions as GlobalOptions) : setGlobalOption(keyOrOptions as string, value);
macl.setGlobalOption = setGlobalOption;
macl.setGlobalOptions = setGlobalOptions;
macl.getGlobalOption = getGlobalOption;
macl.ModelRouter = ModelRouter;

export default macl;
