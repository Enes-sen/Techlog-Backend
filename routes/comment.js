const express = require("express");
const router = express.Router();
const {
  getAll,
  addNewComment,
  deleteAComment,
  deleteCommentLike,
  addCommentLike,
} = require("../controllers/comment");
router.get("/", (req, res) => {
  res.json({ message: "welcome to the comments service layer" });
});
router.get("/All/:id", getAll);
router.post("/addNew", addNewComment);
router.get("/like/:id/:userid", addCommentLike);
router.get("/dislike/:id/:userid", deleteCommentLike);
router.delete("/delete/:id", deleteAComment);

module.exports = router;
