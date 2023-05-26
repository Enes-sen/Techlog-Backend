const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destination = "public/uploads";
    console.log("destination:", destination); // Debug çıktısı
    cb(null, destination);
  },
  filename: function (req, file, cb) {
    const extension = file.mimetype.split("/")[1];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    req.savedImage = "image_" + req.params.id + "_" + uniqueSuffix + "." + extension;
    console.log("imgpath:uploads/",req.savedImage);
    cb(null, req.savedImage);
  },
});

const fileFilter = (req, file, cb) => {
  allowedTypes = ["image/jpg", "image/gif", "image/jpeg", "image/png"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Please provide a valid image file"), false);
  }
  return cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
