const modelProperties = [
  /////////////////////
  // Copy Properties //
  /////////////////////
  'base',
  'modelName',
  'db',
  'discriminators',
  'schema',
  'collection',
  //////////////////
  // Copy Methods //
  //////////////////
  '$wrapCallback',
  'hydrate',
  'bulkWrite',
  'geoSearch',
  'mapReduce',
];

const modelMethods = [
  ////////////////////////
  // Wrap Query Methods //
  ////////////////////////
  'where',
  'remove',
  'deleteOne',
  'deleteMany',
  'find', // find
  'findOne', // findOne
  'findById', // > findOne
  'count', // count
  'countDocuments', // countDocuments
  'estimatedDocumentCount', // estimatedDocumentCount
  'distinct',
  'findOneAndUpdate', // findOneAndUpdate
  'findByIdAndUpdate', // > findOneAndUpdate
  'findOneAndDelete', // findOneAndDelete
  'findByIdAndDelete', // > findOneAndDelete
  'findOneAndRemove', // findOneAndRemove
  'findByIdAndRemove', // > findOneAndRemove
  'update', // update
  'updateOne', // updateOne
  'updateMany', // updateMany
  'replaceOne', // replaceOne
  ///////////////////////////////////////////////
  // Returns an instance of Aggregation object //
  ///////////////////////////////////////////////
  'aggregate', // aggregate
  //////////
  // Etc. //
  //////////
  'populate',
];

module.exports = { modelProperties, modelMethods };
