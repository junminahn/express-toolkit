import * as mongoose from 'mongoose';

interface FindProps {
  query: any;
  select?: any;
  sort?: any;
  populate?: any;
  limit?: any;
  skip?: any;
}

interface FindOneProps {
  query: any;
  select?: any;
  populate?: any;
}

class Model {
  modelName: string;
  model: any;

  constructor(modelName: string) {
    this.modelName = modelName;
    this.model = mongoose.model(modelName);
  }

  new() {
    const doc = new this.model();
    return doc;
  }

  create(data) {
    return this.model.create(data);
  }

  find({ query, select, sort, populate, limit, skip }: FindProps) {
    let builder = this.model.find(query);
    if (select) builder = builder.select(select);
    if (skip) builder = builder.skip(skip);
    if (limit) builder = builder.limit(limit);
    if (sort) builder = builder.sort(sort);
    if (populate) builder = builder.populate(populate);

    return builder;
  }

  findOne({ query, select, populate }: FindOneProps) {
    let builder = this.model.findOne(query);
    if (select) builder = builder.select(select);
    if (populate) builder = builder.populate(populate);

    return builder;
  }

  findOneAndRemove(query) {
    return this.model.findOneAndRemove(query);
  }
}

export default Model;
