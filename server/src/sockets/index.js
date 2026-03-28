const onlineUsers = new Map();
let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("addUser", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId.toString(), socket.id);
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("sendMessage", (data) => {
      const { receiverId, message } = data;

      if (!receiverId || !message) return;

      const receiverSocketId = onlineUsers.get(receiverId.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("getMessage", message);
      }
    });

    socket.on("typing", (data) => {
      const { receiverId, senderId, conversationId } = data;

      if (!receiverId || !senderId || !conversationId) return;

      const receiverSocketId = onlineUsers.get(receiverId.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("getTyping", {
          senderId,
          conversationId,
        });
      }
    });

    socket.on("stopTyping", (data) => {
      const { receiverId, senderId, conversationId } = data;

      if (!receiverId || !senderId || !conversationId) return;

      const receiverSocketId = onlineUsers.get(receiverId.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("getStopTyping", {
          senderId,
          conversationId,
        });
      }
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      console.log("User disconnected:", socket.id);
    });
  });
};

const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId) return;

  const receiverSocketId = onlineUsers.get(userId.toString());

  if (receiverSocketId) {
    ioInstance.to(receiverSocketId).emit(eventName, payload);
  }
};

module.exports = {
  initSocket,
  emitToUser,
};