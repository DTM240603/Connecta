import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import PostCard from "../../components/post/PostCard";
import axiosClient from "../../services/axiosClient";

function PostDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const targetCommentId = location.hash ? location.hash.replace('#', '') : null;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/posts/${id}`);
      setPost(res.data);
      setError(null);
    } catch (error) {
      console.error(error);
      setError("Không thể tải bài viết hoặc bài viết đã bị xóa.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCurrentUser = async () => {
    try {
      const res = await axiosClient.get("/auth/me");
      setCurrentUser(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPost();
    fetchCurrentUser();
  }, [id]);

  return (
    <MainLayout>
      <style>
        {`
          @keyframes blinkHighlight {
            0% { background-color: transparent; }
            50% { background-color: rgba(0, 123, 255, 0.2); }
            100% { background-color: transparent; }
          }
          .blink-bg {
            animation: blinkHighlight 0.8s ease-in-out 3;
          }
        `}
      </style>
      <div className="post-details-page" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '20px' }}>
        <button 
          className="btn btn-outline" 
          onClick={() => navigate(-1)}
          style={{ marginBottom: '20px' }}
        >
          &larr; Quay lại
        </button>

        {loading ? (
          <div className="text-center loading-text">Đang tải bài viết...</div>
        ) : error ? (
          <div className="text-center text-danger" style={{ padding: '20px', background: '#fff', borderRadius: '10px' }}>
            <h3>{error}</h3>
          </div>
        ) : post ? (
          <PostCard
            post={post}
            currentUser={currentUser}
            onRefresh={fetchPost}
            defaultShowComments={true}
            targetCommentId={targetCommentId}
          />
        ) : null}
      </div>
    </MainLayout>
  );
}

export default PostDetailsPage;
