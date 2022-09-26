import UserModel from './user';
import OrgModel from './org';

const loadModels = async () => {
  const models = {
    User: await UserModel,
    Org: await OrgModel,
  };

  return models;
};

export default loadModels;
