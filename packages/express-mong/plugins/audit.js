const mongoose = require('mongoose');

const Schema = mongoose.Schema;

module.exports = function audit(
  schema,
  {
    userSchema = 'User',
    createdBy = 'createdBy',
    updatedBy = 'updatedBy',
    createdAt = 'createdAt',
    updatedAt = 'updatedAt',
  } = {},
) {
  const _createdBy = createdBy !== false && createdBy !== null;
  const _updatedBy = updatedBy !== false && updatedBy !== null;
  const _createdAt = createdAt !== false && createdAt !== null;
  const _updatedAt = updatedAt !== false && updatedAt !== null;

  const newFields = {};
  if (_createdBy) {
    newFields[createdBy] = { type: Schema.ObjectId, ref: userSchema, default: null };
  }
  if (_updatedBy) {
    newFields[updatedBy] = { type: Schema.ObjectId, ref: userSchema, default: null };
  }
  if (_createdAt) {
    newFields[createdAt] = { type: Date, default: Date.now };
  }
  if (_updatedAt) {
    newFields[updatedAt] = { type: Date, default: Date.now };
  }

  schema.add(newFields);
  schema.pre('save', function (next) {
    const req = this.$req;
    if (!req) return next();

    const user = req.user;
    const now = new Date();

    if (this.isNew) {
      if (_createdBy && user) this.createdBy = user._id;
      if (_updatedBy && user) this.updatedBy = user._id;
      if (_createdAt) this.createdAt = now;
      if (_updatedAt) this.updatedAt = now;
    } else {
      if (_updatedBy && user) this.updatedBy = user._id;
      if (_updatedAt) this.updatedAt = now;
    }

    return next();
  });
};
