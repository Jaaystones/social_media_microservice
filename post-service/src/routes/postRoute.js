const express = require("express");
const {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} = require("../controller/postController");
const { authenticateRequest } = require("../middleware/authMiddleware");

const router = express();

//middleware -> this will tell if the user is an auth user or not. only authenticated users can access these routes
router.use(authenticateRequest);

router.post("/create-post", createPost);
router.get("/all-posts", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);

module.exports = router;