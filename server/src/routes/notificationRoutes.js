const express = require("express");
const {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.patch("/read-all", protect, markAllNotificationsAsRead);
router.patch("/:id/read", protect, markNotificationAsRead);

module.exports = router;