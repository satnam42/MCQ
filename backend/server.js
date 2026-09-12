const app = require("./src/app");
const { sequelize } = require("./src/models");
const dotenv = require("dotenv");
const seedDatabase = require("./seeders/index");

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log("✅ Database connected successfully via Sequelize.");

    // Synchronize Database Models (avoid alter: true on SQLite due to FK constraints)
    const isMysql = process.env.DB_DIALECT === "mysql";
    await sequelize.sync(isMysql ? { alter: true } : {});
    console.log("✅ Database models synchronized successfully.");

    // Seed database if requested or empty
    await seedDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `🚀 MCQ API Server running on port ${PORT} on 0.0.0.0 in ${process.env.NODE_ENV || "development"} mode.`,
      );
    });
  } catch (err) {
    console.error("❌ Server startup error:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
