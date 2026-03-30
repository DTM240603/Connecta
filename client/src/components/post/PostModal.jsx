import { useEffect, useState } from "react";
import PostCard from "./PostCard";
import axiosClient from "../../services/axiosClient";

function PostModal({ postId, currentUser, onClose }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/posts/${postId}`);
      setPost(res.data);
      setError(null);
    } catch (error) {
      console.error(error);
      setError("Không thể tải bài viết hoặc bài viết đã bị xóa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  if (!postId) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', background: 'transparent' }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <button onClick={onClose} className="btn" style={{ background: '#fff', borderRadius: '50%', width: '36px', height: '36px', fontWeight: 'bold' }}>✕</button>
        </div>
        
        {loading ? (
          <div className="text-center" style={{ background: '#fff', padding: '20px', borderRadius: '10px' }}>Đang tải bài viết...</div>
        ) : error ? (
          <div className="text-center text-danger" style={{ background: '#fff', padding: '20px', borderRadius: '10px' }}>
            {error}
          </div>
        ) : post ? (
          <div style={{ background: '#fff', borderRadius: '10px' }}>
            <PostCard
                post={post}
                currentUser={currentUser}
                onRefresh={fetchPost}
                defaultShowComments={true}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PostModal;
