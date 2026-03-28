import axiosClient from "./axiosClient";

export const getPostsApi = async () => {
  const response = await axiosClient.get("/posts");
  return response.data;
};

export const getPostsByUserApi = async (userId) => {
  const response = await axiosClient.get(`/posts/user/${userId}`);
  return response.data;
};

export const getPostByIdApi = async (postId) => {
  const response = await axiosClient.get(`/posts/${postId}`);
  return response.data;
};

export const createPostApi = async (payload) => {
  const response = await axiosClient.post("/posts", payload);
  return response.data;
};

export const updatePostApi = async (postId, payload) => {
  const response = await axiosClient.put(`/posts/${postId}`, payload);
  return response.data;
};

export const deletePostApi = async (postId) => {
  const response = await axiosClient.delete(`/posts/${postId}`);
  return response.data;
};

export const toggleLikePostApi = async (postId) => {
  const response = await axiosClient.post(`/posts/${postId}/like`);
  return response.data;
};

export const getCommentsApi = async (postId) => {
  const response = await axiosClient.get(`/posts/${postId}/comments`);
  return response.data;
};

export const addCommentApi = async (postId, payload) => {
  const response = await axiosClient.post(`/posts/${postId}/comments`, payload);
  return response.data;
};

export const uploadPostImageApi = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await axiosClient.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};