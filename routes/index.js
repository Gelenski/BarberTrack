const router = require("express").Router();
const path = require("path");

// router.use("/", require("./auth"));
router.get("/", (req, res) => {
  res
    .status(200)
    .sendFile(path.join(__dirname, "../public/pages/login/index.html"));
});
router.use("/cliente", require("./cliente"));
router.use("/barbearia", require("./barbearia"));

module.exports = router;
