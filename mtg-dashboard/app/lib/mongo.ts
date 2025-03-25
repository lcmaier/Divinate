import { MongoClient, Db } from 'mongodb';

// get the URI and DB connection if they exist, otherwise fallback to defaults
// TODO: pool these constants between this and the Python project to a common reference for consistency
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'mtg_price_tracker';

// check that both were assigned
if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}
if (!MONGODB_DB) {
    throw new Error('Please define the MONGODB_DB environment variable');
}

// create variables to track if we have a cached connection to the db
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// define the names of the MongoDB collections in the database (potentially subject to update)
export const COLLECTIONS = {
    cards: 'cards',
    card_prices: 'card_prices'
  };  

export async function connectToDatabase() {
    // if we have a cached connection, use that
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb}
    }

    //otherwise we have to do it ourselves
    // create a client object to connect to the db
    const client = await MongoClient.connect(MONGODB_URI);

    const db = client.db(MONGODB_DB);

    // now cache the client and db for reuse later
    cachedClient = client;
    cachedDb = db;

    return { client, db };
}