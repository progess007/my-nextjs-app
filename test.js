const jwt = require("jsonwebtoken");

const token = jwt.sign(
  { id: "123", role: "user" },
  "your-secret-key",
  { expiresIn: "7d" }
);

console.log("Generated Token:", token);