const crypto = require("crypto");
const Razorpay = require("razorpay");
const { StatusCodes } = require("http-status-codes");

const { BadRequestError } = require("../errors");

const KafkaProducer = require("../services/KafkaProducer");

const Payment = require("../models/Payment");
const SubscriptionPlan = require("../models/SubscriptionPlan");

const config = require("../config/env");

const razorpayInstance = new Razorpay({
  key_id: config.razorpayKeyID,
  key_secret: config.razorpaySecretKey,
});

const fetchPlans = async (req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true });
  console.log(plans);
  res.status(StatusCodes.OK).json({
    success: true,
    plans,
  });
};

const createPlan = async (req, res) => {
  const { name, type, price, billingCycle, predictionLimit } = req.body;
  const plan = new SubscriptionPlan({
    name,
    type,
    price: {
      amount: price,
      currency: "INR",
      billingCycle,
    },
    features: {
      dailyPredictionLimit: predictionLimit,
    },
  });
  await plan.save();
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Subscription plan created successfully",
    plan,
  });
};

const createOrder = async (req, res) => {
  const { subscriptionId } = req.body;
  if (!subscriptionId) {
    throw new BadRequestError("Missing Subcription Plan ID");
  }
  const subscriptionPlan = await SubscriptionPlan.findById(subscriptionId);

  if (!subscriptionPlan) {
    throw new BadRequestError("Invalid Subcription Plan ID");
  }

  if(subscriptionPlan.isActive === false) {
    throw new BadRequestError("Subscription Plan is not active");
  }

  if(subscriptionPlan.type !== "premium") {
    throw new BadRequestError("Invalid Subscription Plan Type");
  }

  const amount = subscriptionPlan.price.amount * 100;
  const currency = subscriptionPlan.price.currency;
  const options = {
    amount,
    currency,
    receipt: `receipt_${Date.now()}`,
  };

  razorpayInstance.orders.create(options, async (err, order) => {
    if (err) {
      console.error(err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false });
    }
    console.log(order);
    const payment = new Payment({
      userId: req.headers["x-user-id"],
      orderId: order.id,
      planId: subscriptionPlan._id,
      amount: order.amount,
      status: "pending",
    });

    await payment.save();
    res
      .status(StatusCodes.OK)
      .json({ success: true, order, key_id: config.razorpayKeyID });
  });
};

const verifyPayment = async (req, res) => {
  try {
    console.log("Verify Payment Request:", req.body);
    console.log("Request Headers:", req.headers);

    // Extract payment details
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Create a signature using the order_id and payment_id
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpaySecretKey)
      .update(body)
      .digest("hex");

    // Compare the signatures
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const payment = await Payment.findOne({ orderId: razorpay_order_id });
      if (!payment) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Payment not found",
        });
      }
      payment.paymentId = razorpay_payment_id;
      payment.status = "success";
      await payment.save();
      console.log("Payment updated in database:", payment);
      const subscriptionPlan = await SubscriptionPlan.findById(
        payment.planId
      );
      if (!subscriptionPlan) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Subscription plan not found",
        });
      }
      const validityPeriod = subscriptionPlan.price.billingCycle === "monthly" ? 30 : 365;
      const currentDate = new Date();
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + validityPeriod);
      // Send message to Kafka

      await KafkaProducer.connect();
      const message = {
        userId: req.headers["x-user-id"],
        paymentId: payment._id,
        status: "success",
        startDate: currentDate,
        endDate: endDate,
        subscriptionPlanId: subscriptionPlan._id,
        subscriptionPlanType: subscriptionPlan.type,
      };
      console.log(`Kafka Message ${message}`);
      
      await KafkaProducer.sendMessage(config.kafkaPaymentTopic, message);

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Payment verified successfully",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
    } else {
      console.log("Payment verification failed");
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

module.exports = {
  fetchPlans,
  createOrder,
  verifyPayment,
  createPlan,
};
