require('dotenv').config({ path: __dirname + '/.env' });

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const HOSTNAME = process.env.HOST || '0.0.0.0';
export const PORT = process.env.PORT || 3000;
export const DATABASE_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/test';
export const COOKIE_SESSION_NAME = process.env.COOKIE_SESSION_NAME || '';
export const COOKIE_SESSION_SECRET = process.env.COOKIE_SESSION_SECRET || 'verysecuresecret';
