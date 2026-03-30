import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { socket } from "../../services/socket";
import {
  addCommentApi,
  deleteCommentApi,
  deletePostApi,
  getCommentsApi,
  toggleLikePostApi,
  updateCommentApi,
} from "../../services/postService";
import ConfirmModal from "../common/ConfirmModal";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import CommentItem from "./CommentItem";
import EditPostModal from "./EditPostModal";

function PostCard({
  post,
  currentUser,
  onRefresh,
  highlightPostId,
  highlightCommentId,
}) {
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyMeta, setReplyMeta] = useState(null);
  const [activeEditCommentId, setActiveEditCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const postRef = useRef(null);

  const isLiked = post.likes?.some((id) => {
    if (typeof id === "string") return id === currentUser?._id;
    return id?._id === currentUser?._id;
  });

  const isOwner = post.author?._id === currentUser?._id;
  const shouldHighlightPost = highlightPostId === post._id;

  const fetchComments = async () => {
    try {
      const res = await getCommentsApi(post._id);
      setComments(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments]);

  useEffect(() => {
    if (highlightCommentId && shouldHighlightPost) {
      setShowComments(true);
      fetchComments();
    }
  }, [highlightCommentId, shouldHighlightPost]);

  useEffect(() => {
    if (shouldHighlightPost && postRef.current) {
      postRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      postRef.current.classList.add("post-highlight-flash");

      const timer = setTimeout(() => {
        postRef.current?.classList.remove("post-highlight-flash");
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [shouldHighlightPost]);

  useEffect(() => {
    const handleRealtimeComment = (payload) => {
      if (payload?.postId !== post._id) return;

      if (payload.action === "created") {
        setComments((prev) => {
          const existed = prev.some((item) => item._id === payload.comment._id);
          if (existed) return prev;
          return [...prev, payload.comment];
        });
      }

      if (payload.action === "updated") {
        setComments((prev) =>
          prev.map((item) =>
            item._id === payload.comment._id ? payload.comment : item,
          ),
        );
      }

      if (payload.action === "deleted") {
        setComments((prev) =>
          prev.filter((item) => !payload.deletedIds.includes(item._id)),
        );
      }
    };

    socket.on("postCommentChanged", handleRealtimeComment);
    return () => socket.off("postCommentChanged", handleRealtimeComment);
  }, [post._id]);

  const topLevelComments = useMemo(
    () => comments.filter((item) => !item.parentComment),
    [comments],
  );
  const repliesMap = useMemo(
    () =>
      comments.reduce((acc, item) => {
        if (item.parentComment) {
          if (!acc[item.parentComment]) acc[item.parentComment] = [];
          acc[item.parentComment].push(item);
        }
        return acc;
      }, {}),
    [comments],
  );

  const handleLike = async () => {
    try {
      setLoadingLike(true);
      await toggleLikePostApi(post._id);
      await onRefresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingLike(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      setLoadingComment(true);
      await addCommentApi(post._id, { content: commentContent.trim() });
      setCommentContent("");
      setShowComments(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      setDeleting(true);
      await deletePostApi(post._id);
      setOpenDeleteModal(false);
      await onRefresh();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const handleStartReply = (comment) => {
    const parentCommentId = comment.parentComment || comment._id;
    const replyToName = comment.author?.fullName || "Nguoi dung";
    setActiveReplyCommentId(comment._id);
    setReplyMeta({
      parentCommentId,
      replyToUserId: comment.author?._id,
      replyToName,
    });
    setReplyText(`@${replyToName} `);
    setActiveEditCommentId(null);
    setEditText("");
  };

  const handleCancelReply = () => {
    setActiveReplyCommentId(null);
    setReplyMeta(null);
    setReplyText("");
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !replyMeta) return;

    try {
      await addCommentApi(post._id, {
        content: replyText.trim(),
        parentCommentId: replyMeta.parentCommentId,
        replyToUserId: replyMeta.replyToUserId,
      });
      handleCancelReply();
      setShowComments(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartEdit = (comment) => {
    setActiveEditCommentId(comment._id);
    setEditText(comment.content || "");
    setActiveReplyCommentId(null);
    setReplyMeta(null);
    setReplyText("");
  };

  const handleCancelEdit = () => {
    setActiveEditCommentId(null);
    setEditText("");
  };

  const handleSaveEdit = async (comment) => {
    if (!editText.trim()) return;

    try {
      await updateCommentApi(comment._id, { content: editText.trim() });
      handleCancelEdit();
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmDeleteComment = async () => {
    if (!deleteCommentTarget) return;

    try {
      setDeletingComment(true);
      await deleteCommentApi(deleteCommentTarget._id);
      setDeleteCommentTarget(null);
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingComment(false);
    }
  };

  return (
    <>
      <Card ref={postRef} className="post-card">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage
                  src={post.author?.avatar || ""}
                  alt={post.author?.fullName || "avatar"}
                />
                <AvatarFallback>
                  {post.author?.fullName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <Link
                  to={`/users/${post.author?._id}`}
                  className="truncate text-sm font-semibold text-foreground hover:text-primary"
                >
                  {post.author?.fullName || "Người dùng"}
                </Link>
                <div className="mt-0.5 text-xs text-muted">
                  @{post.author?.username || "unknown"} •{" "}
                  {new Date(post.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="relative">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setOpenActionMenu((prev) => !prev)}
                >
                  <MoreHorizontal size={16} />
                </Button>

                {openActionMenu && (
                  <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-line bg-white p-1 shadow-lg">
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-orange-50"
                      onClick={() => {
                        setOpenActionMenu(false);
                        setOpenEditModal(true);
                      }}
                    >
                      <Pencil size={14} />
                      <span>Sửa bài viết</span>
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                      onClick={() => {
                        setOpenActionMenu(false);
                        setOpenDeleteModal(true);
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Xóa bài viết</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {post.content ? <p className="post-content">{post.content}</p> : null}

          {post.image ? (
            <div className="mt-3 overflow-hidden rounded-2xl bg-neutral-100">
              <img
                className="block w-full h-auto max-h-[70vh] object-contain"
                src={post.image}
                alt="post"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between border-y border-line py-3 text-sm text-muted">
            <div>{post.likes?.length || 0} lượt thích</div>
            <div>{comments.length} bình luận</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              className="justify-center"
              onClick={handleLike}
              disabled={loadingLike}
            >
              <Heart
                size={16}
                className={isLiked ? "fill-current text-primary" : ""}
              />
              {isLiked ? "Bỏ thích" : "Thích"}
            </Button>
            <Button
              variant="ghost"
              className="justify-center"
              onClick={() => setShowComments((prev) => !prev)}
            >
              <MessageCircle size={16} />
              {showComments ? "Ẩn bình luận" : "Xem bình luận"}
            </Button>
          </div>

          {showComments && (
            <div className="space-y-4 border-t border-line pt-4">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Nhập bình luận..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="rounded-full bg-orange-50/50"
                />
                <Button type="submit" disabled={loadingComment}>
                  {loadingComment ? "Đang gửi..." : "Gửi"}
                </Button>
              </form>

              <div className="space-y-3">
                {topLevelComments.length === 0 ? (
                  <div className="rounded-xl bg-orange-50/40 px-4 py-5 text-center text-sm text-muted">
                    Chưa có bình luận nào
                  </div>
                ) : (
                  topLevelComments.map((comment) => (
                    <CommentItem
                      key={comment._id}
                      comment={comment}
                      replies={repliesMap[comment._id] || []}
                      currentUser={currentUser}
                      postOwnerId={post.author?._id}
                      activeReplyCommentId={activeReplyCommentId}
                      replyText={replyText}
                      setReplyText={setReplyText}
                      onStartReply={handleStartReply}
                      onSubmitReply={handleSubmitReply}
                      onCancelReply={handleCancelReply}
                      activeEditCommentId={activeEditCommentId}
                      editText={editText}
                      setEditText={setEditText}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onRequestDelete={setDeleteCommentTarget}
                      highlightCommentId={highlightCommentId}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditPostModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        post={post}
        onUpdated={onRefresh}
      />

      <ConfirmModal
        open={openDeleteModal}
        title="Xóa bài viết?"
        description="Bài viết này sẽ bị xóa khỏi tin của bạn."
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleDeletePost}
        onCancel={() => setOpenDeleteModal(false)}
        loading={deleting}
      />

      <ConfirmModal
        open={!!deleteCommentTarget}
        title="Xóa bình luận?"
        description="Bình luận này sẽ bị xóa khỏi bài viết."
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleConfirmDeleteComment}
        onCancel={() => setDeleteCommentTarget(null)}
        loading={deletingComment}
      />
    </>
  );
}

export default PostCard;
