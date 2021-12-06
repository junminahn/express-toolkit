import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

mongoose.model('Document', DocumentSchema);

const Status = new mongoose.Schema({
  name: { type: String, required: true },
  approved: { type: Boolean, default: false },
  document: { type: 'ObjectId', ref: 'Document', default: null },
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'] },
  statusHistory: { type: [Status], default: [] },
  statusHistory2: [new mongoose.Schema({ name: 'string' })],
  statusHistory3: [{ name: 'string' }],
  orgs: [{ type: 'ObjectId', ref: 'Org' }],
  public: { type: Boolean, default: false },
});

export default mongoose.model('User', UserSchema);
