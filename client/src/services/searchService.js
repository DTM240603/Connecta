import axiosClient from "./axiosClient";

export const searchAllApi = async (keyword) => {
  const response = await axiosClient.get("/search", {
    params: {
      q: keyword,
    },
  });

  return response.data;
};
