const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const env = require('./env');

let memoryServer = null;

/**
 * Connects to MongoDB. In development, setting USE_MEMORY_DB=true boots a
 * persistent local MongoDB instance (data stored under MEMORY_DB_PATH) so the
 * project runs without a system-wide MongoDB installation. In production the
 * regular MONGODB_URI is used.
 */
async function connectDB() {
  let uri = env.MONGODB_URI;

  if (env.USE_MEMORY_DB) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.resolve(process.cwd(), env.MEMORY_DB_PATH);
    fs.mkdirSync(dbPath, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger' },
      binary: { version: process.env.MONGO_BINARY_VERSION || '7.0.14' },
    });
    uri = memoryServer.getUri('messmgmt');
    console.log(`[db] local persistent MongoDB started at ${uri}`);
  }

  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

async function disconnectDB() {
  await mongoose.connection.close();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
