require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./sockets");

const PORT = process.env.APP_PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  initSocket(io);

  server.listen(PORT, () => {
    console.log(`Server running at http://${process.env.APP_HOST}:${PORT}`);
  });
};

startServer();