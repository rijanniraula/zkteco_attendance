const express = require("express");
const { getMyAttendance } = require("../controllers/me");
const { requireAuth, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { dateRange } = require("../helpers/schemas");

const router = express.Router();

// Super admins manage attendance but aren't tracked themselves
router.use(requireAuth, requireRole("employee"));

// get own attendance history
router.get("/attendance", validate(dateRange, "query"), getMyAttendance);

module.exports = router;
