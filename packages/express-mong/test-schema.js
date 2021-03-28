const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const mongAudit = require('./plugins/audit');
const { testEqual } = require('./test-helpers');

const testSchema = new Schema({ name: String, timestamp: Number, ref: { type: 'ObjectId', ref: 'Test2' } });
////////////////////
// VALIDATE HOOKS //
////////////////////
testSchema.pre('validate', function (next) {
  testEqual('pre validate', this.$req && this.$req.timestamp, this.timestamp);
  next();
});

testSchema.post('validate', function (doc) {
  testEqual('post validate', this.$req && this.$req.timestamp, this.timestamp);
});

////////////////
// SAVE HOOKS //
////////////////
testSchema.pre('save', function (next) {
  testEqual('pre save', this.$req && this.$req.timestamp, this.timestamp);
  next();
});

testSchema.post('save', function (doc) {
  testEqual('post save', this.$req && this.$req.timestamp, this.timestamp);
});

//////////////////
// REMOVE HOOKS //
//////////////////
testSchema.pre('remove', function (next) {
  testEqual('pre remove', this.$req && this.$req.timestamp, this.timestamp);
  next();
});

testSchema.post('remove', function (doc) {
  testEqual('post remove', this.$req && this.$req.timestamp, this.timestamp);
});

////////////////
// FIND HOOKS //
////////////////
testSchema.pre('find', function () {
  const query = this.getQuery();
  testEqual('pre find', this.$req && this.$req.timestamp, query.timestamp);
});

testSchema.post('find', function () {
  const query = this.getQuery();
  testEqual('post find', this.$req && this.$req.timestamp, query.timestamp);
});

////////////////////
// FIND-ONE HOOKS //
////////////////////
testSchema.pre('findOne', function (next) {
  const query = this.getQuery();
  testEqual('pre findOne', this.$req && this.$req.timestamp, query.timestamp);
  next();
});

testSchema.post('findOne', function () {
  const query = this.getQuery();
  testEqual('post findOne', this.$req && this.$req.timestamp, query.timestamp);
});

///////////////////////////////
// FIND-ONE-AND-UPDATE HOOKS //
///////////////////////////////
testSchema.pre('findOneAndUpdate', function () {
  const query = this.getQuery();
  testEqual('pre findOneAndUpdate', this.$req && this.$req.timestamp, query.timestamp);
});

testSchema.post('findOneAndUpdate', function () {
  const query = this.getQuery();
  testEqual('post findOneAndUpdate', this.$req && this.$req.timestamp, query.timestamp);
});

///////////////////////////////
// FIND-ONE-AND-DELETE HOOKS //
///////////////////////////////
testSchema.pre('findOneAndDelete', function () {
  const query = this.getQuery();
  testEqual('pre findOneAndDelete', this.$req && this.$req.timestamp, query.timestamp);
});

testSchema.post('findOneAndDelete', function () {
  const query = this.getQuery();
  testEqual('post findOneAndDelete', this.$req && this.$req.timestamp, query.timestamp);
});

/////////////////////////
// FIND-ONE-AND-REMOVE //
/////////////////////////
testSchema.pre('findOneAndRemove', function () {
  const query = this.getQuery();
  testEqual('pre findOneAndRemove', this.$req && this.$req.timestamp, query.timestamp);
});

testSchema.post('findOneAndRemove', function () {
  const query = this.getQuery();
  testEqual('post findOneAndRemove', this.$req && this.$req.timestamp, query.timestamp);
});

/////////////////
// COUNT HOOKS //
/////////////////
testSchema.pre('count', function () {
  const query = this.getQuery();
  testEqual('pre count', this.$req && this.$req.timestamp, query.timestamp);
});

testSchema.post('count', function () {
  const query = this.getQuery();
  testEqual('post count', this.$req && this.$req.timestamp, query.timestamp);
});

////////////
// UPDATE //
////////////
testSchema.pre('update', function () {
  const query = this.getQuery();
  testEqual('pre update', this.$req && this.$req.timestamp, query.timestamp);
});

testSchema.post('update', function () {
  const query = this.getQuery();
  testEqual('post update', this.$req && this.$req.timestamp, query.timestamp);
});

////////////////
// UPDATE-ONE //
////////////////
testSchema.pre('updateOne', function () {
  const query = this.getQuery();
  testEqual('pre updateOne', this.$req && this.$req.timestamp, query.timestamp);
});

testSchema.post('updateOne', function () {
  const query = this.getQuery();
  testEqual('post updateOne', this.$req && this.$req.timestamp, query.timestamp);
});

/////////////////
// UPDATE-MANY //
/////////////////
testSchema.pre('updateMany', function () {
  const query = this.getQuery();
  testEqual('pre updateMany', this.$req && this.$req.timestamp, query.timestamp);
});

testSchema.post('updateMany', function () {
  const query = this.getQuery();
  testEqual('post updateMany', this.$req && this.$req.timestamp, query.timestamp);
});

/////////////////
// REPLACE-ONE //
/////////////////
testSchema.pre('replaceOne', function () {
  const query = this.getQuery();
  testEqual('pre replaceOne', this.$req && this.$req.timestamp, query.timestamp);
});

testSchema.post('replaceOne', function () {
  const query = this.getQuery();
  testEqual('post replaceOne', this.$req && this.$req.timestamp, query.timestamp);
});

/////////////////
// DELETE-ONE //
/////////////////
testSchema.pre('deleteOne', function () {
  const query = this.getQuery();
  testEqual('pre deleteOne', this.$req && this.$req.timestamp, query.timestamp);
});

testSchema.post('deleteOne', function () {
  const query = this.getQuery();
  testEqual('post deleteOne', this.$req && this.$req.timestamp, query.timestamp);
});

/////////////////
// DELETE-MANY //
/////////////////
testSchema.pre('deleteMany', function () {
  const query = this.getQuery();
  testEqual('pre deleteMany', this.$req && this.$req.timestamp, query.timestamp);
});

testSchema.post('deleteMany', function () {
  const query = this.getQuery();
  testEqual('post deleteMany', this.$req && this.$req.timestamp, query.timestamp);
});

///////////////
// AGGREGATE //
///////////////
testSchema.pre('aggregate', function () {
  testEqual('pre aggregate', this.$req && this.$req.timestamp, this.pipeline()[0].$match.timestamp);
});

testSchema.post('aggregate', function () {
  testEqual('post aggregate', this.$req && this.$req.timestamp, this.pipeline()[0].$match.timestamp);
});

testSchema.methods.method1 = function (timestamp) {
  testEqual('method1', this.$req && this.$req.timestamp, this.timestamp);
};

testSchema.statics.static1 = function (timestamp) {
  testEqual('static1', this.$req && this.$req.timestamp, timestamp);
};

testSchema.set('toObject', {
  transform: function (doc, ret, options) {
    ret = doc.$req.timestamp;
    return ret;
  },
});

testSchema.plugin(mongAudit);

const test2Schema = new Schema({ name: String });
const userSchema = new Schema({ name: String });

const defineTestModels = function () {
  const Test2 = mongoose.model('Test2', test2Schema);
  const Test = mongoose.model('Test', testSchema);
  const User = mongoose.model('User', userSchema);
};

module.exports = { defineTestModels };
