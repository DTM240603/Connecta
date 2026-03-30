import { MessageSquareMore } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

function ConversationList({
  conversations,
  currentUser,
  selectedConversationId,
  onSelectConversation,
  loading,
  onlineUsers = [],
}) {
  const getOtherMember = (conversation) => {
    return conversation.members?.find(
      (member) => member._id !== currentUser?._id,
    );
  };

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  return (
    <Card className="h-full overflow-hidden lg:sticky lg:top-24">
      <CardHeader className="border-b border-line/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-primary">
            <MessageSquareMore size={18} />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Tin nhắn
            </CardTitle>
            <p className="mt-1 text-sm text-muted">
              Chọn một cuộc trò chuyện để tiếp tục.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {loading ? (
          <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-8 text-center text-sm text-muted">
            Đang tải cuộc trò chuyện...
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-8 text-center text-sm text-muted">
            Chưa có cuộc trò chuyện nào
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const otherUser = getOtherMember(conversation);
              const isActive = selectedConversationId === conversation._id;
              const online = isUserOnline(otherUser?._id);

              return (
                <button
                  key={conversation._id}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-3xl border px-3 py-3 text-left transition-all ${
                    isActive
                      ? "border-orange-200 bg-orange-50 shadow-sm"
                      : "border-transparent bg-white hover:border-orange-100 hover:bg-orange-50/60"
                  }`}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 border border-orange-100">
                      <AvatarImage
                        src={otherUser?.avatar || "https://i.pravatar.cc/100"}
                        alt={otherUser?.fullName || "avatar"}
                      />
                      <AvatarFallback>
                        {(otherUser?.fullName || "U").slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>

                    {online && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {otherUser?.fullName || "Người dùng"}
                    </div>
                    <div className="mt-1 truncate text-xs text-muted">
                      {conversation.lastMessage || "Chưa có tin nhắn"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ConversationList;
