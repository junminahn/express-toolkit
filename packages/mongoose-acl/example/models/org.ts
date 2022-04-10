import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

mongoose.model('Location', LocationSchema);

const OrgSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locations: [{ type: 'ObjectId', ref: 'Location' }],
});

export default mongoose.model('Org', OrgSchema);
