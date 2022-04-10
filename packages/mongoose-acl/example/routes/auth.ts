import JsonRouter from 'express-json-router';
import _ from 'lodash';
const router = new JsonRouter();
const clientErrors = JsonRouter.clientErrors;

router.get('/', async (req, res) => {
  return 'auth route';
});

export default router.original;
