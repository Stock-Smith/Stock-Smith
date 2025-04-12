const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment, createPlan, fetchPlans } = require("../controllers/subscription");

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.post("/create-plan", createPlan);
router.get("/fetch-plans", fetchPlans);

module.exports = router;