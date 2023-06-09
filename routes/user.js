const express = require("express");
const router = express.Router();
const upload = require("../helpers/multer");
const userController = require("../controllers/user");

router.get("/", (req, res) => {
  res.json({ message: "Welcome to the users service layer" });
});


router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/logout", userController.logout);
router.get("/user/:id", userController.findUserById);
router.post("/sendmail", userController.sendMail);
router.get('/public/uploads/:filename', userController.getUserImage);
router.get("/All",userController.getAll);
router.put("/profilimg_upload/:id", upload.single("image"), userController.uploadPhoto);
router.post("/forgotpassword", userController.forgotPassword);
router.put("/resetpassword", userController.changePassword);

module.exports = router;
