const Router = require("express");
const { downloadFile } = require("../controllers/download.controller");

const router = Router();

router.get("/:filename", downloadFile);

module.exports = router;
