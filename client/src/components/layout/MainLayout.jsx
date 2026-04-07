import { useEffect, useMemo, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "motion/react";
import {
  Bell,
  ChevronDown,
  LogOut,
  MessageCircleMore,
  PencilLine,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { removeToken } from "../../utils/token";
import { dedupeConversationsForUser } from "../../utils/chat";
import { socket } from "../../services/socket";
import { getNotificationsApi } from "../../services/notificationService";
import {
  deleteConversationPermanentlyApi,
  getMyConversationsApi,
  hideConversationForMeApi,
} from "../../services/chatService";
import ChatDropdown from "../chat/ChatDropdown";
import MiniChatBox from "../chat/MiniChatBox";
import ConfirmModal from "../common/ConfirmModal";
import NotificationDropdown from "../notification/NotificationDropdown";
import SearchInput from "../search/SearchInput";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import EditProfileModal from "./EditProfileModal";

function MainLayout({ children, user, onUserUpdated }) {
  const navigate = useNavigate();
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);
  const [openChatDropdown, setOpenChatDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNoti, setUnreadNoti] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [chatBoxes, setChatBoxes] = useState([]);
  const [hideConversationTarget, setHideConversationTarget] = useState(null);
  const [deleteConversationTarget, setDeleteConversationTarget] =
    useState(null);
  const [processingConversationAction, setProcessingConversationAction] =
    useState(false);

  const handleLogout = () => {
    removeToken();
    navigate("/login");
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
      const list = dedupeConversationsForUser(res.data || [], user?._id);
      setConversations(list);
      setUnreadMessages(
        list.reduce((total, item) => total + (item.unreadCount || 0), 0),
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
    return () => window.removeEventListener("openChat", handleOpenChatEvent);
  }, [user?._id, conversations]);

  useEffect(() => {
    const handleRealtimeMessage = (incomingMessage) => {
      const senderId = incomingMessage?.sender?._id;
      const conversationId = incomingMessage?.conversation;
      const isConversationOpen = chatBoxes.some(
        (box) => box._id === conversationId,
      );

      setConversations((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((item) => item._id === conversationId);

        if (index !== -1) {
          const oldConversation = updated[index];
          const updatedConversation = {
            ...oldConversation,
            lastMessage: incomingMessage.text || "Da gui mot hinh anh",
            updatedAt: new Date().toISOString(),
            unreadCount:
              senderId === user?._id
                ? oldConversation.unreadCount || 0
                : isConversationOpen
                  ? 0
                  : (oldConversation.unreadCount || 0) + 1,
          };

          updated.splice(index, 1);
          updated.unshift(updatedConversation);
        }

        const deduped = dedupeConversationsForUser(updated, user?._id);

        setUnreadMessages(
          deduped.reduce((total, item) => total + (item.unreadCount || 0), 0),
        );

        return deduped;
      });
    };

    socket.on("getMessage", handleRealtimeMessage);
    return () => socket.off("getMessage", handleRealtimeMessage);
  }, [chatBoxes, user?._id]);

  const openMiniChat = (conversation) => {
    const normalizedConversation = {
      ...conversation,
      currentUserId: user?._id,
      unreadCount: 0,
    };

    setChatBoxes((prev) => {
      if (prev.find((item) => item._id === normalizedConversation._id)) {
        return prev;
      }
      return [...prev, normalizedConversation];
    });

    setConversations((prev) => {
      const updated = prev.map((item) =>
        item._id === normalizedConversation._id
          ? { ...item, unreadCount: 0 }
          : item,
      );
      setUnreadMessages(
        updated.reduce((total, item) => total + (item.unreadCount || 0), 0),
      );
      return updated;
    });

    setOpenChatDropdown(false);
  };

  const closeMiniChat = (conversationId) => {
    setChatBoxes((prev) => prev.filter((item) => item._id !== conversationId));
  };

  const removeConversationFromState = (conversationId) => {
    setConversations((prev) => {
      const updated = prev.filter((item) => item._id !== conversationId);
      setUnreadMessages(
        updated.reduce((total, item) => total + (item.unreadCount || 0), 0),
      );
      return updated;
    });

    closeMiniChat(conversationId);
  };

  const handleHideConversation = async () => {
    if (!hideConversationTarget?._id) return;

    try {
      setProcessingConversationAction(true);
      await hideConversationForMeApi(hideConversationTarget._id);
      removeConversationFromState(hideConversationTarget._id);
      setHideConversationTarget(null);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingConversationAction(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!deleteConversationTarget?._id) return;

    try {
      setProcessingConversationAction(true);
      await deleteConversationPermanentlyApi(deleteConversationTarget._id);
      removeConversationFromState(deleteConversationTarget._id);
      setDeleteConversationTarget(null);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingConversationAction(false);
    }
  };

  const chatBoxesWithPosition = useMemo(
    () =>
      chatBoxes.map((conversation, index) => ({
        ...conversation,
        otherUser: conversation.members?.find((m) => m._id !== user?._id),
        rightOffset: 20 + index * 360,
      })),
    [chatBoxes, user?._id],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="topbar">
        <div className="container flex h-full items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/" className="brand-link text-primary">
              Connecta
            </Link>

            <SearchInput />
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <div className="relative shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="relative rounded-full border-transparent bg-orange-50 hover:bg-orange-100"
                onClick={() => {
                  setOpenChatDropdown((prev) => !prev);
                  setOpenNotification(false);
                }}
              >
                <MessageCircleMore size={18} />
                {unreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </Button>
              <ChatDropdown
                open={openChatDropdown}
                conversations={conversations}
                currentUserId={user?._id}
                onSelectConversation={openMiniChat}
                onHideConversation={setHideConversationTarget}
                onDeleteConversation={setDeleteConversationTarget}
              />
            </div>

            <div className="relative shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="relative rounded-full border-transparent bg-orange-50 hover:bg-orange-100"
                onClick={() => {
                  setOpenNotification((prev) => !prev);
                  setOpenChatDropdown(false);
                }}
              >
                <Bell size={18} />
                {unreadNoti > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                    {unreadNoti > 99 ? "99+" : unreadNoti}
                  </span>
                )}
              </Button>
              <NotificationDropdown
                open={openNotification}
                onClose={() => setOpenNotification(false)}
                onUnreadChange={setUnreadNoti}
                externalNotifications={notifications}
                setExternalNotifications={setNotifications}
              />
            </div>

            <div className="relative shrink-0">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex h-11 w-[196px] shrink-0 items-center justify-between rounded-full border border-orange-100 bg-white px-1.5 py-1 text-left shadow-sm transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 data-[state=open]:bg-orange-50">
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user?.avatar || ""}
                          alt={user?.fullName || "avatar"}
                        />
                        <AvatarFallback>
                          {user?.fullName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden min-w-0 max-w-[108px] truncate text-sm font-medium text-foreground md:block">
                        {user?.fullName || "Người dùng"}
                      </span>
                    </span>
                    <ChevronDown
                      size={16}
                      className="mr-1 hidden shrink-0 text-muted md:block"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={10}
                  className="w-60"
                >
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <UserRound size={16} />
                      <span>Trang cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                    <PencilLine size={16} />
                    <span>Chỉnh sửa thông tin</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-500 focus:text-red-500"
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container container-with-fixed-header">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {children}
        </motion.div>
      </main>

      <EditProfileModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        user={user}
        onUpdated={onUserUpdated || (() => {})}
      />

      <ConfirmModal
        open={!!hideConversationTarget}
        title="Ẩn cuộc trò chuyện?"
        description="Cuộc trò chuyện này sẽ bị ẩn khỏi danh sách tin nhắn của bạn."
        confirmText="Ẩn"
        cancelText="Hủy"
        onConfirm={handleHideConversation}
        onCancel={() => setHideConversationTarget(null)}
        loading={processingConversationAction}
      />

      <ConfirmModal
        open={!!deleteConversationTarget}
        title="Xóa cuộc trò chuyện?"
        description="Cuộc trò chuyện và toàn bộ tin nhắn sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleDeleteConversation}
        onCancel={() => setDeleteConversationTarget(null)}
        loading={processingConversationAction}
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
