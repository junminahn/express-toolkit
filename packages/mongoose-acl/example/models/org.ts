import mongoose from 'mongoose';
import { permissionsPlugin } from '../../src/plugins';

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

mongoose.model('Location', LocationSchema);

const OrgSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locations: [{ type: 'ObjectId', ref: 'Location' }],
});

OrgSchema.plugin(permissionsPlugin, { modelName: 'Org' });

export default mongoose.model('Org', OrgSchema);
