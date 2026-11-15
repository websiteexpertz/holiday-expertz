import mongoose from "mongoose";

// Fix Node.js DNS SRV resolution error (querySrv EBADRESP) common with MongoDB Atlas on some ISPs/routers
if (typeof process !== "undefined" && process.env.NEXT_RUNTIME === "nodejs") {
  import("node:dns")
    .then((dns) => {
      try {
        dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
      } catch {
        // Ignore in environments where setting servers is restricted
      }
    })
    .catch(() => {});
}

function getMongoUri(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  throw new Error("MONGODB_URI is required but is not configured.");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = getMongoUri();

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
