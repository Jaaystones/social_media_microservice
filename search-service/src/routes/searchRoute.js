const express = require("express");
const { searchPostController } = require("../controller/searchController");
const { authenticateRequest } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateRequest);

router.get("/posts", searchPostController);

module.exports = router;