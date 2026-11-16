const jwt = require("jsonwebtoken");
const db = require("../db");
const HttpError = require("../helpers/httpError");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

const PUBLIC_USER_FIELDS = `id, name, email, role, device_user_id, shift_group_id,
  is_active, must_change_password, created_at, updated_at`;

// Verifies the Bearer token and loads the active user into req.user
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Authentication required");

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }

  const user = db
    .prepare(`SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = ? AND is_active = 1`)
    .get(payload.sub);
  if (!user) throw new HttpError(401, "Account not found or disabled");

  req.user = user;
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    throw new HttpError(403, "You do not have access to this resource");
  }
  next();
};

module.exports = { signToken, requireAuth, requireRole, PUBLIC_USER_FIELDS };
