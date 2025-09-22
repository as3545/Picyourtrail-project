// routes/inquiryRoutes.js
const express = require("express");
const { handleInquiry } = require("../routes/inquiryController");

const router = express.Router();

router.post("/inquiry", handleInquiry);

module.exports = router;
