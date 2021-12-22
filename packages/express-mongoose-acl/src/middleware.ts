import { setGenerators } from './generators';

export default function macl() {
  return async function (req, res, next) {
    await setGenerators(req, res, next);
  };
}
