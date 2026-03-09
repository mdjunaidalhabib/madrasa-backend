import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
console.log("DB_USER =", process.env.DB_USER);

import bcrypt from "bcrypt";

bcrypt.hash("123456", 10).then((hash) => {
  console.log("SUPER ADMIN HASH =", hash);
});