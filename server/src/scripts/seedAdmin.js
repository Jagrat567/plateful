import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { User } from "../modules/users/user.model.js";

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD } = process.env;
if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PHONE || !ADMIN_PASSWORD) {
  console.error("Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, and ADMIN_PASSWORD in server/.env");
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 8) {
  console.error("ADMIN_PASSWORD must contain at least 8 characters");
  process.exit(1);
}

await connectDatabase();
let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() }).select("+passwordHash");
if (!admin) admin = new User({ name: ADMIN_NAME, email: ADMIN_EMAIL.toLowerCase(), phone: ADMIN_PHONE, role: "admin" });
admin.name = ADMIN_NAME;
admin.phone = ADMIN_PHONE;
admin.role = "admin";
await admin.setPassword(ADMIN_PASSWORD);
await admin.save();
console.log(`Admin ready: ${admin.email}`);
await disconnectDatabase();
