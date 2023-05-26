const express = require("express");
const router = express.Router();
const comments = require("./comment");
const {
  getAll,
  addNewPost,
  getAllbyuser,
  getOne,
  deleteOne,
  addlike,
  deletelike
} = require("../controllers/post");
router.get("/", (req, res) => {
  res.json({ message: "welcome to the posts service layer" });
});
router.use("/comments",comments);
router.get("/all", getAll);
router.get("/one/:id", getOne);

router.get("/all/:id", getAllbyuser);
router.get("/like/:id/:userid", addlike);
router.get("/dislike/:id/:userid",deletelike);
router.post("/new", addNewPost);
router.delete("/delete/:id", deleteOne);

module.exports = router;
