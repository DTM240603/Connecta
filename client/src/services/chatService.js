import axiosClient from "./axiosClient";

export const createOrGetConversationApi = async (receiverId) => {
  const response = await axiosClient.post("/conversations", { receiverId });
  return response.data;
};

export const getMyConversationsApi = async () => {
  const response = await axiosClient.get("/conversations");
  return response.data;
};

export const hideConversationForMeApi = async (conversationId) => {
  const response = await axiosClient.patch(
    `/conversations/${conversationId}/hide`,
  );
  return response.data;
};

export const deleteConversationPermanentlyApi = async (conversationId) => {
  const response = await axiosClient.delete(`/conversations/${conversationId}`);
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

export const updateMessageApi = async (messageId, payload) => {
  const response = await axiosClient.patch(`/messages/edit/${messageId}`, payload);
  return response.data;
};

export const deleteMessageForMeApi = async (messageId) => {
  const response = await axiosClient.patch(`/messages/delete-for-me/${messageId}`);
  return response.data;
};

export const recallMessageApi = async (messageId) => {
  const response = await axiosClient.delete(`/messages/recall/${messageId}`);
  return response.data;
};
