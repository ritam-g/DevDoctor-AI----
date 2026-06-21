import app from "./app.ts";
import { env } from "./config/env.ts";
import { connectDB } from "./config/database.ts";
// import "./config/redis.ts";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${env.PORT || 5000}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();