import axiosClient from "./axiosClient";

export const createOrGetConversationApi = async (receiverId) => {
  const response = await axiosClient.post("/conversations", { receiverId });
  return response.data;
};

export const getMyConversationsApi = async () => {
  const response = await axiosClient.get("/conversations");
  return response.data;
};

export const sendMessageApi = async (payload) => {
  const response = await axiosClient.post("/messages", payload);
  return response.data;
};

export const getMessagesByConversationApi = async (conversationId) => {
  const response = await axiosClient.get(`/messages/${conversationId}`);
  return response.data;
};

export const markConversationAsSeenApi = async (conversationId) => {
  const response = await axiosClient.patch(`/messages/${conversationId}/seen`);
  return response.data;
};