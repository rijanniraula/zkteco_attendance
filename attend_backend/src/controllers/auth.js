const bcrypt = require("bcryptjs");
const db = require("../db");
const HttpError = require("../helpers/httpError");
const { signToken, PUBLIC_USER_FIELDS } = require("../middleware/auth");

const login = (req, res) => {
  const { email, password } = req.body;
  const user = db
    .prepare("SELECT * FROM users WHERE email = ? AND is_active = 1")
    .get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw new HttpError(401, "Invalid email or password");
  }
  const publicUser = db
    .prepare(`SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = ?`)
    .get(user.id);
  res.json({ success: true, token: signToken(user), user: publicUser });
};

const me = (req, res) => {
  res.json({ success: true, user: req.user });
};

const changePassword = (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { password_hash } = db
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, password_hash)) {
    throw new HttpError(400, "Current password is incorrect");
  }
  db.prepare(
    `UPDATE users SET password_hash = ?, must_change_password = 0,
     updated_at = datetime('now', 'localtime') WHERE id = ?`
  ).run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ success: true });
};

module.exports = { login, me, changePassword };
