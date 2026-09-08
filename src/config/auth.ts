import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGO_URI is required");
const mongoClient = new MongoClient(mongoUri);
const databaseName = new URL(mongoUri).pathname.replace(/^\//, "") || "onstage";

export const auth = betterAuth({
    database: mongodbAdapter(mongoClient.db(databaseName), { client: mongoClient }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    trustedOrigins: (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173").split(",").map((origin) => origin.trim()),
    emailAndPassword: { enabled: true, disableSignUp: true },
    user: {
        additionalFields: {
            employeeRole: { type: "string", required: false },
        },
    },
    plugins: [admin()],
});
