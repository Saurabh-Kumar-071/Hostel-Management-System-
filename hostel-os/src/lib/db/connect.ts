import mongoose from "mongoose";
import { logger } from "@/lib/utils/logger";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

if (!global.__mongooseConnection) {
  global.__mongooseConnection = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global.__mongooseConnection.conn) {
    return global.__mongooseConnection.conn;
  }

  if (!global.__mongooseConnection.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    global.__mongooseConnection.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongooseInstance) => {
        logger.info("MongoDB connected successfully");
        return mongooseInstance;
      })
      .catch((error) => {
        logger.error({ error }, "MongoDB connection failed");
        global.__mongooseConnection.promise = null;
        throw error;
      });
  }

  global.__mongooseConnection.conn = await global.__mongooseConnection.promise;
  return global.__mongooseConnection.conn;
}

export function getConnectionState(): string {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] ?? "unknown";
}

