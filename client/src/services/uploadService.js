import axiosClient from "./axiosClient";

export const uploadImageApi = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await axiosClient.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};