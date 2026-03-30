import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Reply, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

function CommentItem({
  comment,
  replies = [],
  currentUser,
  postOwnerId,
  activeReplyCommentId,
  replyText,
  setReplyText,
  onStartReply,
  onSubmitReply,
  onCancelReply,
  activeEditCommentId,
  editText,
  setEditText,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRequestDelete,
  highlightCommentId,
}) {
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);
  const commentRef = useRef(null);

  const isCommentOwner = currentUser?._id === comment.author?._id;
  const isPostOwner = currentUser?._id === postOwnerId;
  const canEdit = isCommentOwner;
  const canDelete = isCommentOwner || isPostOwner;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (highlightCommentId === comment._id && commentRef.current) {
      commentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      commentRef.current.classList.add("comment-highlight-flash");

      const timer = setTimeout(() => {
        commentRef.current?.classList.remove("comment-highlight-flash");
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [highlightCommentId, comment._id]);

  const isEditing = activeEditCommentId === comment._id;
  const isReplying = activeReplyCommentId === comment._id;

  return (
    <div ref={commentRef} className="comment-thread">
      <div className="comment-item-card">
        <Link
          to={`/users/${comment.author?._id}`}
          className="comment-avatar-link"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={comment.author?.avatar || ""}
              alt={comment.author?.fullName || "avatar"}
            />
            <AvatarFallback>
              {comment.author?.fullName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="comment-main flex-1 rounded-2xl border border-orange-100 bg-orange-50/50">
          <div className="comment-top-row flex items-start justify-between gap-2">
            <div className="comment-top-left">
              <Link
                to={`/users/${comment.author?._id}`}
                className="comment-author-link"
              >
                <span className="comment-author-name text-sm font-semibold text-foreground">
                  {comment.author?.fullName || "Người dùng"}
                </span>
              </Link>
              <span className="comment-time text-xs text-muted">
                {new Date(comment.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>

            {(canEdit || canDelete) && (
              <div className="comment-menu-wrapper relative" ref={menuRef}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setOpenMenu((prev) => !prev)}
                >
                  <MoreHorizontal size={15} />
                </Button>

                {openMenu && (
                  <div className="comment-action-dropdown absolute right-0 top-9 z-20 w-36 rounded-xl border border-line bg-white p-1 shadow-lg">
                    {canEdit && (
                      <button
                        className="comment-action-item flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-orange-50"
                        onClick={() => {
                          setOpenMenu(false);
                          onStartEdit(comment);
                        }}
                      >
                        <Pencil size={14} />
                        <span>Sửa</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        className="comment-action-item flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                        onClick={() => {
                          setOpenMenu(false);
                          onRequestDelete(comment);
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="comment-edit-box mt-3">
              <Textarea
                className="min-h-24 bg-white"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              <div className="comment-inline-actions mt-2">
                <Button size="sm" onClick={() => onSaveEdit(comment)}>
                  Lưu
                </Button>
                <Button size="sm" variant="outline" onClick={onCancelEdit}>
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <div className="comment-content mt-2 text-sm leading-6 text-foreground">
              {comment.content}
            </div>
          )}

          {!isEditing && (
            <div className="comment-bottom-actions mt-2">
              <button
                className="comment-reply-btn inline-flex items-center gap-1 text-sm font-medium text-primary"
                onClick={() => onStartReply(comment)}
              >
                <Reply size={14} />
                <span>Trả lời</span>
              </button>
            </div>
          )}

          {isReplying && (
            <div className="comment-reply-box mt-3 space-y-2">
              <Textarea
                className="min-h-24 bg-white"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập trả lời..."
              />
              <div className="comment-inline-actions">
                <Button size="sm" onClick={() => onSubmitReply(comment)}>
                  Gửi
                </Button>
                <Button size="sm" variant="outline" onClick={onCancelReply}>
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="comment-replies-list ml-10 mt-3 space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              replies={[]}
              currentUser={currentUser}
              postOwnerId={postOwnerId}
              activeReplyCommentId={activeReplyCommentId}
              replyText={replyText}
              setReplyText={setReplyText}
              onStartReply={onStartReply}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              activeEditCommentId={activeEditCommentId}
              editText={editText}
              setEditText={setEditText}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onRequestDelete={onRequestDelete}
              highlightCommentId={highlightCommentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentItem;
