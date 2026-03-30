import {
  EyeOff,
  MoreHorizontal,
  MessageCircleMore,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { dedupeConversationsForUser } from "../../utils/chat";

function ChatDropdown({
  open,
  conversations = [],
  currentUserId,
  onSelectConversation,
  onHideConversation,
  onDeleteConversation,
}) {
  if (!open) return null;

  const visibleConversations = dedupeConversationsForUser(
    conversations,
    currentUserId,
  );

  return (
    <div className="message-dropdown">
      <div className="border-b border-line px-4 py-3">
        <h3 className="text-base font-semibold text-foreground">Tin nhắn</h3>
      </div>

      <div className="max-h-[26rem] overflow-y-auto py-1">
        {visibleConversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted">
            <MessageCircleMore size={20} className="text-orange-400" />
            <span>Chưa có cuộc trò chuyện nào</span>
          </div>
        ) : (
          visibleConversations.map((conversation) => {
            const otherUser = conversation.members?.find(
              (member) => member._id !== currentUserId,
            );

            return (
              <div
                key={conversation._id}
                className="message-dropdown-item flex w-full items-center gap-3 px-4 py-2.5"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => onSelectConversation(conversation)}
                >
                  <Avatar className="h-11 w-11">
                    <AvatarImage
                      src={otherUser?.avatar || ""}
                      alt={otherUser?.fullName || "avatar"}
                    />
                    <AvatarFallback>
                      {otherUser?.fullName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="message-dropdown-content min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {otherUser?.fullName || "Nguoi dung"}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {conversation.lastMessage || "Bắt đầu cuộc trò chuyện"}
                    </div>
                  </div>

                  {conversation.unreadCount > 0 && (
                    <Badge className="ml-2 shrink-0">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </button>

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full text-muted"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal size={15} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={(event) => {
                        event.stopPropagation();
                        onHideConversation?.(conversation);
                      }}
                    >
                      <EyeOff size={14} />
                      <span>Ẩn</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteConversation?.(conversation);
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Xóa</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ChatDropdown;
