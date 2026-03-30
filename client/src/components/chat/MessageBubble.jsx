import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "../ui/button";

function MessageBubble({
  message,
  isOwnMessage,
  isSeenByOther = false,
  showSeenText = false,
  onEdit,
  onDeleteForMe,
  onRecall,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [openActions, setOpenActions] = useState(false);
  const actionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionRef.current && !actionRef.current.contains(event.target)) {
        setOpenActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canEdit = !!onEdit;
  const canRecall = !!onRecall;

  return (
    <div
      className={`message-row ${isOwnMessage ? "own" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!openActions) setIsHovered(false);
      }}
    >
      <div className="relative max-w-[78%]" ref={actionRef}>
        <div
          className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 transition-opacity duration-150 ${
            isOwnMessage
              ? "left-0 -translate-x-[calc(100%+0.5rem)]"
              : "right-0 translate-x-[calc(100%+0.5rem)]"
          } ${isHovered || openActions ? "opacity-100" : "opacity-0"}`}
        >
          <Button
            size="icon"
            variant="ghost"
            className="pointer-events-auto h-8 w-8 rounded-full bg-white/95 text-muted shadow-sm ring-1 ring-orange-100"
            onClick={() => setOpenActions((prev) => !prev)}
          >
            <MoreHorizontal size={16} />
          </Button>

          {openActions && (
            <div
              className={`pointer-events-auto absolute top-9 min-w-36 rounded-2xl border border-orange-100 bg-white p-1 shadow-xl ${
                isOwnMessage ? "right-0" : "left-0"
              }`}
            >
              {canEdit && (
                <button className="message-action-item" onClick={onEdit}>
                  <Pencil size={14} />
                  <span>Sua</span>
                </button>
              )}

              <button className="message-action-item" onClick={onDeleteForMe}>
                <Trash2 size={14} />
                <span>Xoa</span>
              </button>

              {canRecall && (
                <button
                  className="message-action-item text-red-500"
                  onClick={onRecall}
                >
                  <RotateCcw size={14} />
                  <span>Thu hoi</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div
          className={`message-bubble px-4 py-3 ${isOwnMessage ? "own-bubble" : ""}`}
        >
          {!isOwnMessage && (
            <div className="mb-1 text-xs font-semibold text-muted">
              {message.sender?.fullName || message.sender?.username || "User"}
            </div>
          )}

          {message.text ? (
            <div className="text-sm leading-6 text-foreground">
              {message.text}
            </div>
          ) : null}

          {message.image ? (
            <img
              className="message-image mt-2 max-w-[260px] rounded-2xl object-cover"
              src={message.image}
              alt="message"
            />
          ) : null}

          <div className="message-time mt-2 text-[11px] text-muted">
            {new Date(message.createdAt).toLocaleString("vi-VN")}
            {message.isEdited ? " • Da chinh sua" : ""}
          </div>

          {isOwnMessage && isSeenByOther && showSeenText && (
            <div className="message-seen-text mt-1 text-[11px] text-primary">
              Da xem
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
