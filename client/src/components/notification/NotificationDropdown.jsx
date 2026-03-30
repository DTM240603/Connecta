import { useEffect, useMemo } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../services/socket";
import {
  getNotificationsApi,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from "../../services/notificationService";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

function NotificationDropdown({
  open,
  onClose,
  onUnreadChange,
  externalNotifications,
  setExternalNotifications,
}) {
  const navigate = useNavigate();
  const notifications = externalNotifications || [];

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsApi();
      setExternalNotifications?.(res.data || []);
    } catch (error) {
      console.error(error);
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
        const existed = current.some(
          (item) => item._id === newNotification._id,
        );
        if (existed) return current;
        return [newNotification, ...current];
      });
    };

    socket.on("getNotification", handleReceiveNotification);
    return () => socket.off("getNotification", handleReceiveNotification);
  }, [setExternalNotifications]);

  const handleClickNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsReadApi(notification._id);
        setExternalNotifications?.((prev) =>
          prev.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item,
          ),
        );
      }

      if (notification.type === "follow") {
        navigate(`/users/${notification.sender?._id}`);
      } else if (notification.post?._id) {
        const query = new URLSearchParams();
        query.set("postId", notification.post._id);
        if (notification.comment?._id) {
          query.set("commentId", notification.comment._id);
        }
        navigate(`/?${query.toString()}`);
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
        prev.map((item) => ({ ...item, isRead: true })),
      );
    } catch (error) {
      console.error(error);
    }
  };

  if (!open) return null;

  return (
    <div className="notification-dropdown">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-base font-semibold text-foreground">Thông báo</h3>
        {notifications.length > 0 && unreadCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReadAll}
            className="text-primary"
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </div>

      <div className="max-h-[28rem] overflow-y-auto py-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted">
            <Bell size={20} className="text-orange-400" />
            <span>Chưa có thông báo nào</span>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification._id}
              className="notification-item w-full px-4 py-3"
              onClick={() => handleClickNotification(notification)}
            >
              <Avatar className="h-11 w-11">
                <AvatarImage
                  src={notification.sender?.avatar || ""}
                  alt={notification.sender?.fullName || "avatar"}
                />
                <AvatarFallback>
                  {notification.sender?.fullName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="notification-content min-w-0 flex-1">
                <div className="text-sm leading-5 text-foreground">
                  <span className="font-semibold">
                    {notification.sender?.fullName || "Nguoi dung"}
                  </span>{" "}
                  {notification.message}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {new Date(notification.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>

              {!notification.isRead && (
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;
