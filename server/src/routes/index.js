const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const postRoutes = require("./postRoutes");
const uploadRoutes = require("./uploadRoutes");
const conversationRoutes = require("./conversationRoutes");
const messageRoutes = require("./messageRoutes");
const notificationRoutes = require("./notificationRoutes");
const searchRoutes = require("./searchRoutes");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/upload", uploadRoutes);
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/search", searchRoutes);

module.exports = router;
