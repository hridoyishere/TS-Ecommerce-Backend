import "dotenv/config";

import app from "./app.js";
import db from "./config/database.js";

const PORT = Number(process.env.PORT) || 5000;

async function startServer(): Promise<void> {
  try {
    await db.query("SELECT NOW()");

    console.log("PostgreSQL connected successfully!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);

    await db.end();

    process.exit(1);
  }
}

startServer();