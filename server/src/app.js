const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.send("Connecta backend is running 🚀");
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;