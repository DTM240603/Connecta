const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response");
const {
    getMyNotificationsService,
    markNotificationAsReadService,
    markAllNotificationsAsReadService,
} = require("../services/notificationService");

const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await getMyNotificationsService(req.user._id);

    return successResponse(
        res,
        "Lấy danh sách thông báo thành công",
        notifications
    );
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await markNotificationAsReadService(
        req.params.id,
        req.user._id
    );

    return successResponse(
        res,
        "Đánh dấu đã đọc thành công",
        notification
    );
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    await markAllNotificationsAsReadService(req.user._id);

    return successResponse(
        res,
        "Đánh dấu tất cả thông báo đã đọc thành công",
        null
    );
});

module.exports = {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
};