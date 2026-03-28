const Notification = require("../models/Notification");
const { emitToUser } = require("../sockets");

const createNotificationService = async ({
    recipient,
    sender,
    type,
    post = null,
    message = "",
}) => {
    if (!recipient || !sender || !type) {
        throw new Error("Thiếu dữ liệu để tạo thông báo");
    }

    if (recipient.toString() === sender.toString()) {
        return null;
    }

    let notification = await Notification.create({
        recipient,
        sender,
        type,
        post,
        message,
    });

    notification = await Notification.findById(notification._id)
        .populate("sender", "fullName username avatar")
        .populate("post", "content image author");

    emitToUser(recipient, "getNotification", notification);

    return notification;
};

const getMyNotificationsService = async (userId) => {
    const notifications = await Notification.find({
        recipient: userId,
    })
        .populate("sender", "fullName username avatar")
        .populate("post", "content image author")
        .sort({ createdAt: -1 });

    return notifications;
};

const markNotificationAsReadService = async (notificationId, userId) => {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
        throw new Error("Không tìm thấy thông báo");
    }

    if (notification.recipient.toString() !== userId.toString()) {
        throw new Error("Bạn không có quyền cập nhật thông báo này");
    }

    notification.isRead = true;
    await notification.save();

    return notification;
};

const markAllNotificationsAsReadService = async (userId) => {
    await Notification.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true } }
    );

    return true;
};

module.exports = {
    createNotificationService,
    getMyNotificationsService,
    markNotificationAsReadService,
    markAllNotificationsAsReadService,
};