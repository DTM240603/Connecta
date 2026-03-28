import axiosClient from "./axiosClient";

export const getNotificationsApi = async () => {
    const response = await axiosClient.get("/notifications");
    return response.data;
};

export const markNotificationAsReadApi = async (notificationId) => {
    const response = await axiosClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
};

export const markAllNotificationsAsReadApi = async () => {
    const response = await axiosClient.patch("/notifications/read-all");
    return response.data;
};