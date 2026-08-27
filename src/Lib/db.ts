import sql, { ConnectionPool } from "mssql";

const config = {
  server: process.env.DB_SERVER!,
  port: Number(process.env.DB_PORT || 1433),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_DATABASE!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let poolPromise: Promise<ConnectionPool> | null = null;

export async function getConnection(): Promise<ConnectionPool> {
  const missingVariables = ["DB_SERVER", "DB_USER", "DB_PASSWORD", "DB_DATABASE"]
    .filter((name) => !process.env[name]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing database variables: ${missingVariables.join(", ")}`);
  }

  try {
    if (!poolPromise) {
      poolPromise = new sql.ConnectionPool(config).connect();
    }

    return await poolPromise;
  } catch (err) {
    poolPromise = null;
    throw new Error("Database Connection Failed: " + err);
  }
}
