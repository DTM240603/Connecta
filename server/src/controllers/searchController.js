const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response");
const { searchAllService } = require("../services/searchService");

const searchAll = asyncHandler(async (req, res) => {
  const keyword = req.query.q || "";
  const results = await searchAllService(keyword);

  return successResponse(res, "Tìm kiếm thành công", results);
});

module.exports = {
  searchAll,
};
