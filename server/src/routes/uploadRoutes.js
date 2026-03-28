const express = require("express");
const upload = require("../config/multer");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Không có file được upload",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Upload ảnh thành công",
    data: {
      url: `http://localhost:${process.env.APP_PORT}/uploads/${req.file.filename}`,
    },
  });
});

module.exports = router;