import mysql from "mysql2/promise";

export const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "admin",
    database: "projeto_karaoke",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export async function testDatabaseConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully.");
    connection.release();
  } catch (error) {
    console.error("Database connection error:", error);
  }
}