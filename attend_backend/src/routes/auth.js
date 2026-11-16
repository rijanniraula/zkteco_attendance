const express = require("express");
const { login, me, changePassword } = require("../controllers/auth");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { z } = require("../helpers/schemas");

const router = express.Router();

router.post(
  "/login",
  validate(z.object({ email: z.string().trim().email(), password: z.string().min(1) })),
  login
);

router.get("/me", requireAuth, me);

router.post(
  "/change-password",
  requireAuth,
  validate(
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, "New password must be at least 8 characters"),
    })
  ),
  changePassword
);

module.exports = router;
