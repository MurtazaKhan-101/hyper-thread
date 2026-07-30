// One-off/reusable script to create or promote a user to admin.
// Usage: node scripts/createAdmin.js <email> <password> [firstName] [lastName]
require("dotenv").config();
const bcrypt = require("bcrypt");
const connectDB = require("../config/dbconnect");
const User = require("../models/User");

async function main() {
  const [, , email, password, firstName = "Admin", lastName = "User"] =
    process.argv;

  if (!email || !password) {
    console.error(
      "Usage: node scripts/createAdmin.js <email> <password> [firstName] [lastName]",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters long");
    process.exit(1);
  }

  await connectDB();

  const normalizedEmail = email.toLowerCase().trim();
  const saltRounds = parseInt(process.env.SALT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    user.password = hashedPassword;
    user.role = "admin";
    user.isVerified = true;
    await user.save();
    console.log(`Existing user promoted to admin: ${normalizedEmail}`);
  } else {
    user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
      onboardingCompleted: true,
    });
    console.log(`Admin user created: ${normalizedEmail}`);
  }

  await require("mongoose").disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to create admin user:", error);
  process.exit(1);
});
