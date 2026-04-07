const router = require("express").Router();

router.use("/", require("./auth"));
router.use("/cliente", require("./cliente"));
router.use("/barbearia", require("./barbearia"));

module.exports = router;