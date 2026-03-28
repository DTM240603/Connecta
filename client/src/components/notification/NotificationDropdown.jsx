import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../services/socket";
import {
    getNotificationsApi,
    markAllNotificationsAsReadApi,
    markNotificationAsReadApi,
} from "../../services/notificationService";

function NotificationDropdown({
    open,
    onClose,
    onUnreadChange,
    externalNotifications,
    setExternalNotifications,
}) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const notifications = externalNotifications || [];

    const unreadCount = useMemo(() => {
        return notifications.filter((item) => !item.isRead).length;
    }, [notifications]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await getNotificationsApi();
            setExternalNotifications?.(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        onUnreadChange?.(unreadCount);
    }, [unreadCount, onUnreadChange]);

    useEffect(() => {
        const handleReceiveNotification = (newNotification) => {
            setExternalNotifications?.((prev) => {
                const current = Array.isArray(prev) ? prev : [];

                const existed = current.some((item) => item._id === newNotification._id);
                if (existed) return current;

                return [newNotification, ...current];
            });
        };

        socket.on("getNotification", handleReceiveNotification);

        return () => {
            socket.off("getNotification", handleReceiveNotification);
        };
    }, [setExternalNotifications]);

    const handleClickNotification = async (notification) => {
        try {
            if (!notification.isRead) {
                await markNotificationAsReadApi(notification._id);

                setExternalNotifications?.((prev) =>
                    prev.map((item) =>
                        item._id === notification._id ? { ...item, isRead: true } : item
                    )
                );
            }

            if (notification.type === "follow") {
                navigate(`/users/${notification.sender?._id}`);
            } else if (notification.post?.author) {
                navigate(`/users/${notification.post.author}`);
            }

            onClose?.();
        } catch (error) {
            console.error(error);
        }
    };

    const handleReadAll = async () => {
        try {
            await markAllNotificationsAsReadApi();

            setExternalNotifications?.((prev) =>
                prev.map((item) => ({ ...item, isRead: true }))
            );
        } catch (error) {
            console.error(error);
        }
    };

    if (!open) return null;

    return (
        <div className="notification-dropdown">
            <div className="notification-header">
                <h3>Thông báo</h3>

                {notifications.length > 0 && unreadCount > 0 && (
                    <button className="notification-read-all" onClick={handleReadAll}>
                        Đánh dấu đã đọc
                    </button>
                )}
            </div>

            <div className="notification-body">
                {loading ? (
                    <div className="notification-empty">Đang tải thông báo...</div>
                ) : notifications.length === 0 ? (
                    <div className="notification-empty">Chưa có thông báo nào</div>
                ) : (
                    notifications.map((notification) => (
                        <button
                            key={notification._id}
                            className="notification-item"
                            onClick={() => handleClickNotification(notification)}
                        >
                            <img
                                src={notification.sender?.avatar || "https://i.pravatar.cc/100"}
                                alt="avatar"
                                className="notification-avatar"
                            />

                            <div className="notification-content">
                                <div className="notification-text">
                                    <strong>
                                        {notification.sender?.fullName || "Người dùng"}
                                    </strong>{" "}
                                    {notification.message}
                                </div>

                                <div className="notification-time">
                                    {new Date(notification.createdAt).toLocaleString("vi-VN")}
                                </div>
                            </div>

                            {!notification.isRead && (
                                <span className="notification-unread-dot"></span>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

export default NotificationDropdown;