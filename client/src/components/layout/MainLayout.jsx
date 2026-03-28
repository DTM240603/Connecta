import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { removeToken } from "../../utils/token";
import { socket } from "../../services/socket";
import { getNotificationsApi } from "../../services/notificationService";
import { getMyConversationsApi } from "../../services/chatService";
import NotificationDropdown from "../notification/NotificationDropdown";
import ChatDropdown from "../chat/ChatDropdown";
import MiniChatBox from "../chat/MiniChatBox";
import EditProfileModal from "./EditProfileModal";

function MainLayout({ children, user, onUserUpdated }) {
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);
  const [openChatDropdown, setOpenChatDropdown] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadNoti, setUnreadNoti] = useState(0);

  const [conversations, setConversations] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const [chatBoxes, setChatBoxes] = useState([]);

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  const handleOpenEditProfile = () => {
    setOpenMenu(false);
    setOpenEditModal(true);
  };

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsApi();
      const list = res.data || [];
      setNotifications(list);
      setUnreadNoti(list.filter((item) => !item.isRead).length);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await getMyConversationsApi();
      const list = res.data || [];
      setConversations(list);
      setUnreadMessages(
        list.reduce((total, item) => total + (item.unreadCount || 0), 0)
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    fetchNotifications();
    fetchConversations();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("addUser", user._id);
  }, [user?._id]);

  useEffect(() => {
    const handleOpenChatEvent = (event) => {
      if (event?.detail) {
        openMiniChat(event.detail);
      }
    };

    window.addEventListener("openChat", handleOpenChatEvent);

    return () => {
      window.removeEventListener("openChat", handleOpenChatEvent);
    };
  }, [user?._id, conversations]);

  useEffect(() => {
    const handleRealtimeMessage = (incomingMessage) => {
      const senderId = incomingMessage?.sender?._id;
      const conversationId = incomingMessage?.conversation;

      const isConversationOpen = chatBoxes.some(
        (box) => box._id === conversationId
      );

      setConversations((prev) => {
        let updated = [...prev];

        const index = updated.findIndex((item) => item._id === conversationId);

        if (index !== -1) {
          const oldConversation = updated[index];
          const newUnreadCount = isConversationOpen
            ? 0
            : (oldConversation.unreadCount || 0) + 1;

          const updatedConversation = {
            ...oldConversation,
            lastMessage: incomingMessage.text || "Đã gửi một hình ảnh",
            updatedAt: new Date().toISOString(),
            unreadCount: senderId === user?._id ? oldConversation.unreadCount || 0 : newUnreadCount,
          };

          updated.splice(index, 1);
          updated.unshift(updatedConversation);
        }

        const unreadTotal = updated.reduce(
          (total, item) => total + (item.unreadCount || 0),
          0
        );
        setUnreadMessages(unreadTotal);

        return updated;
      });
    };

    socket.on("getMessage", handleRealtimeMessage);

    return () => {
      socket.off("getMessage", handleRealtimeMessage);
    };
  }, [chatBoxes, user?._id]);

  const openMiniChat = (conversation) => {
    const normalizedConversation = {
      ...conversation,
      currentUserId: user?._id,
      unreadCount: 0,
    };

    setChatBoxes((prev) => {
      const exists = prev.find((item) => item._id === normalizedConversation._id);
      if (exists) return prev;
      return [...prev, normalizedConversation];
    });

    setConversations((prev) => {
      const updated = prev.map((item) =>
        item._id === normalizedConversation._id
          ? { ...item, unreadCount: 0 }
          : item
      );

      const unreadTotal = updated.reduce(
        (total, item) => total + (item.unreadCount || 0),
        0
      );
      setUnreadMessages(unreadTotal);

      return updated;
    });

    setOpenChatDropdown(false);
  };

  const closeMiniChat = (conversationId) => {
    setChatBoxes((prev) => prev.filter((item) => item._id !== conversationId));
  };

  const chatBoxesWithPosition = useMemo(() => {
    return chatBoxes.map((conversation, index) => {
      const otherUser = conversation.members?.find((m) => m._id !== user?._id);

      return {
        ...conversation,
        otherUser,
        rightOffset: 20 + index * 360,
      };
    });
  }, [chatBoxes, user?._id]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <Link to="/" className="brand-link">
            Connecta
          </Link>
        </div>

        <div className="topbar-right">
          {/* Notification */}
          <div className="notification-wrapper">
            <button
              className="header-icon-link notification-btn"
              onClick={() => {
                setOpenNotification((prev) => !prev);
                setOpenMenu(false);
                setOpenChatDropdown(false);
              }}
            >
              <span className="notification-bell">🔔</span>
              {unreadNoti > 0 && (
                <span className="notification-badge">
                  {unreadNoti > 99 ? "99+" : unreadNoti}
                </span>
              )}
            </button>

            <NotificationDropdown
              open={openNotification}
              onClose={() => setOpenNotification(false)}
              onUnreadChange={setUnreadNoti}
              externalNotifications={notifications}
              setExternalNotifications={setNotifications}
            />
          </div>

          {/* Message */}
          <div className="notification-wrapper">
            <button
              className="header-icon-link notification-btn"
              onClick={() => {
                setOpenChatDropdown((prev) => !prev);
                setOpenMenu(false);
                setOpenNotification(false);
              }}
            >
              <span className="notification-bell">💬</span>
              {unreadMessages > 0 && (
                <span className="notification-badge">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
            </button>

            <ChatDropdown
              open={openChatDropdown}
              conversations={conversations}
              currentUserId={user?._id}
              onSelectConversation={openMiniChat}
            />
          </div>

          {/* Avatar */}
          <div className="avatar-menu">
            <img
              src={user?.avatar || "https://i.pravatar.cc/100"}
              alt="avatar"
              className="header-avatar"
              onClick={() => {
                setOpenMenu((prev) => !prev);
                setOpenNotification(false);
                setOpenChatDropdown(false);
              }}
            />

            {openMenu && (
              <div className="avatar-dropdown">
                <Link
                  to="/profile"
                  className="dropdown-item"
                  onClick={() => setOpenMenu(false)}
                >
                  Trang cá nhân
                </Link>

                <button
                  className="dropdown-item dropdown-btn"
                  onClick={handleOpenEditProfile}
                >
                  Chỉnh sửa thông tin
                </button>

                <button className="dropdown-item dropdown-btn" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container container-with-fixed-header">{children}</main>

      <EditProfileModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        user={user}
        onUpdated={onUserUpdated || (() => { })}
      />

      <div className="mini-chat-container">
        {chatBoxesWithPosition.map((conversation) => (
          <div
            key={conversation._id}
            style={{
              position: "fixed",
              right: `${conversation.rightOffset}px`,
              bottom: "20px",
              zIndex: 1500,
            }}
          >
            <MiniChatBox
              currentUser={user}
              targetUser={conversation.otherUser}
              conversation={conversation}
              onClose={() => closeMiniChat(conversation._id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MainLayout;