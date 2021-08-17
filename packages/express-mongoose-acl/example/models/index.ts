import fs from 'fs';
import path from 'path';
const basename = path.basename(__filename);
const models = {};

fs.readdirSync(__dirname)
  .filter((file) => file.indexOf('.') !== 0 && file !== basename && ['.js', '.ts'].includes(file.slice(-3)))
  .forEach((file) => {
    const Model = require(path.join(__dirname, file));

    // covers ES6 modules
    const m = Model.default || Model;
    models[m.modelName] = m;
  });

export default models;
