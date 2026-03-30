const express = require("express");
const { searchAll } = require("../controllers/searchController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, searchAll);

module.exports = router;
