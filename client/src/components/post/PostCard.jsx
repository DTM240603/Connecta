import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  addCommentApi,
  deletePostApi,
  getCommentsApi,
  toggleLikePostApi,
} from "../../services/postService";
import ConfirmModal from "../common/ConfirmModal";
import EditPostModal from "./EditPostModal";

function PostCard({ post, currentUser, onRefresh }) {
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState(false);

  const menuRef = useRef(null);

  const isLiked = post.likes?.some((id) => {
    if (typeof id === "string") return id === currentUser?._id;
    return id?._id === currentUser?._id;
  });

  const isOwner = post.author?._id === currentUser?._id;

  const fetchComments = async () => {
    try {
      const res = await getCommentsApi(post._id);
      setComments(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenActionMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      await addCommentApi(post._id, {
        content: commentContent.trim(),
      });
      setCommentContent("");
      await fetchComments();
      await onRefresh();
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

  const handlePostUpdated = async () => {
    await onRefresh();
  };

  return (
    <>
      <div className="card post-card">
        <div className="post-header">
          <div className="post-author-row">
            <img
              src={post.author?.avatar || "https://i.pravatar.cc/100"}
              alt="avatar"
              className="post-author-avatar"
            />

            <div className="post-author-main">
              <Link to={`/users/${post.author?._id}`} className="post-author-link">
                <h3>{post.author?.fullName || "Người dùng"}</h3>
              </Link>

              <p className="muted">
                @{post.author?.username || "unknown"} •{" "}
                {new Date(post.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>

            {isOwner && (
              <div className="post-menu-wrapper" ref={menuRef}>
                <button
                  className="post-menu-trigger"
                  onClick={() => setOpenActionMenu((prev) => !prev)}
                >
                  ⋯
                </button>

                {openActionMenu && (
                  <div className="post-action-dropdown">
                    <button
                      className="post-action-item"
                      onClick={() => {
                        setOpenActionMenu(false);
                        setOpenEditModal(true);
                      }}
                    >
                      Sửa bài viết
                    </button>

                    <button
                      className="post-action-item post-action-delete"
                      onClick={() => {
                        setOpenActionMenu(false);
                        setOpenDeleteModal(true);
                      }}
                    >
                      Xóa bài viết
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="post-content">{post.content}</p>

        {post.image ? (
          <img className="post-image" src={post.image} alt="post" />
        ) : null}

        <div className="post-actions">
          <button className="btn btn-outline" onClick={handleLike} disabled={loadingLike}>
            {isLiked ? "Bỏ thích" : "Thích"} ({post.likes?.length || 0})
          </button>

          <button
            className="btn btn-outline"
            onClick={() => setShowComments((prev) => !prev)}
          >
            {showComments ? "Ẩn bình luận" : "Xem bình luận"}
          </button>
        </div>

        {showComments && (
          <div className="comment-box">
            <form onSubmit={handleAddComment} className="comment-form">
              <input
                className="input"
                type="text"
                placeholder="Nhập bình luận..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={loadingComment}>
                {loadingComment ? "Đang gửi..." : "Gửi"}
              </button>
            </form>

            <div className="comment-list">
              {comments.length === 0 ? (
                <p className="muted">Chưa có bình luận nào</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="comment-item">
                    <strong>{comment.author?.fullName || "User"}:</strong>{" "}
                    <span>{comment.content}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <EditPostModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        post={post}
        onUpdated={handlePostUpdated}
      />

      <ConfirmModal
        open={openDeleteModal}
        title="Xóa bài viết?"
        description="Bài viết này sẽ bị xóa khỏi bảng tin của bạn. Bạn có chắc chắn muốn tiếp tục không?"
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleDeletePost}
        onCancel={() => setOpenDeleteModal(false)}
        loading={deleting}
      />
    </>
  );
}

export default PostCard;