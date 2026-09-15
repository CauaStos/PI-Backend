import "dotenv/config"
import { createLocalAccountIssuer } from "better-auth"
import { auth } from "./config/auth.js"
import database from "./config/database.js"
import Employee from "./modules/employees/employees.model.js"

const email = process.env.BOOTSTRAP_ADMIN_EMAIL
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD
const name = process.env.BOOTSTRAP_ADMIN_NAME ?? "Administrador"

if (!email || !password) {
  throw new Error(
    "BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required"
  )
}
if (password.length < 8) {
  throw new Error("BOOTSTRAP_ADMIN_PASSWORD must have at least 8 characters")
}

await database.connect()
const normalizedEmail = email.toLowerCase()
const existingEmployee = await Employee.findOne({ email: normalizedEmail })
if (existingEmployee?.authUserId) {
  console.log("Administrador ja configurado.")
} else {
  const context = await auth.$context
  const existingAccount = await context.internalAdapter.findUserByEmail(
    normalizedEmail,
    { includeAccounts: true }
  )
  const user =
    existingAccount?.user ??
    (await context.internalAdapter.createUser(
      {
        email: normalizedEmail,
        emailVerified: true,
        name,
        role: "admin",
        employeeRole: "admin",
      },
      { method: "admin" }
    ))
  if (!existingAccount) {
    await context.internalAdapter.linkAccount({
      accountId: user.id,
      issuer: createLocalAccountIssuer("credential"),
      password: await context.password.hash(password),
      providerId: "credential",
      userId: user.id,
    })
  }
  try {
    await Employee.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name,
        email: normalizedEmail,
        role: "admin",
        avatar: name.charAt(0).toUpperCase(),
        authUserId: user.id,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    )
  } catch (error) {
    if (!existingAccount) await context.internalAdapter.deleteUser(user.id)
    throw error
  }
  console.log(`Administrador criado: ${email}`)
}
process.exit(0)
