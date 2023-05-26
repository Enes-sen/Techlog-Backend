const express = require("express");
const cors = require("cors");
const ports = require("./routes/routes.js");
const path = require("path");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const bodyParser = require("body-parser");
const env = require("dotenv");
env.config({ path: "./.env/.env" });
const app = express();
const port = process.env.PORT || 3200;
app.use(cors({ origin: "*" }));
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: "Multer error: " + err.message });
  } else {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});
app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json({extended: true }));
app.use(express.static("public"));



app.get("/", (req, res) => {
  res.json({ message: "techlog api" });
});
app.use("/api/", ports);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    app.listen(port, () => {
      console.log(`db Listening on port:${port}`);
    })
  )
  .catch((error) => console.log(error.message));
