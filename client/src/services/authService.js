import axiosClient from "./axiosClient";

export const registerApi = async (payload) => {
  const response = await axiosClient.post("/auth/register", payload);
  return response.data;
};

export const loginApi = async (payload) => {
  const response = await axiosClient.post("/auth/login", payload);
  return response.data;
};

export const getMeApi = async () => {
  const response = await axiosClient.get("/users/me");
  return response.data;
};

export const updateMeApi = async (payload) => {
  const response = await axiosClient.put("/users/me", payload);
  return response.data;
};

export const getUsersApi = async () => {
  const response = await axiosClient.get("/users");
  return response.data;
};

export const toggleFollowApi = async (userId) => {
  const response = await axiosClient.post(`/users/${userId}/follow`);
  return response.data;
};

export const getUserProfileApi = async (userId) => {
  const response = await axiosClient.get(`/users/${userId}`);
  return response.data;
};