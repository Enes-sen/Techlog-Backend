const express = require("express");
const router = express.Router();
const post = require("./post");
const user = require("./user");
router.get("/", (req, res) => {
  res.json({ message: "welcome to the main service layer" });
});

router.use("/users",user);
router.use("/posts",post);

module.exports = router;
