import { MongoClient } from 'mongodb';

const options = {};

let client;
let clientPromise;

function getClientPromise() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error('Please add your MONGODB_URI to Vercel environment variables.');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  // Production: create a new client per cold start
  if (!clientPromise) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDatabase() {
  const c = await getClientPromise();
  return c.db('micro_learning');
}

export default getClientPromise;
