const { StatusCodes } = require("http-status-codes");
const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const crypto = require("crypto");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const config = require("../config/env");

const razorpayInstance = new Razorpay({
    key_id: config.razorpayKeyID,
    key_secret: config.razorpaySecretKey
});

const fetchPlans = async(req, res) => {
    const plans = await SubscriptionPlan.find( { isActive: true } );
    console.log(plans);
    res.status(StatusCodes.OK).json({ 
        success: true,
        plans
    });
};

const createOrder = async(req, res) => {
    console.log("Hello",req.body);
    
    const amount = req.body.amount * 100;
    const currency = "INR";
    const options = {
        amount,
        currency,
        receipt: `receipt_${Date.now()}`,
    }

    razorpayInstance.orders.create(options, async (err, order) => {
        if(err) {
            console.error(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false });
        }
        console.log(order);
        res.status(StatusCodes.OK).json({ success: true, order });
    });
}

const verifyPayment = async (req, res) => {
    try {
      console.log("Verify Payment Request:", req.body);
      
      // Extract payment details
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;
  
      // Create a signature using the order_id and payment_id
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", config.razorpaySecretKey)
        .update(body)
        .digest("hex");
  
      // Compare the signatures
      const isAuthentic = expectedSignature === razorpay_signature;
  
      if (isAuthentic) {
        // Payment is verified - update your database here
        console.log("Payment verified successfully");
        
        // Example: Store payment details in database
        // await Payment.create({
        //   razorpay_order_id,
        //   razorpay_payment_id,
        //   razorpay_signature,
        //   amount: req.body.amount,
        //   user_id: req.user.id,
        //   status: 'completed'
        // });
  
        return res.status(StatusCodes.OK).json({
          success: true,
          message: "Payment verified successfully",
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id
        });
      } else {
        console.log("Payment verification failed");
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Payment verification failed"
        });
      }
    } catch (error) {
      console.error("Payment Verification Error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Payment verification failed"
      });
    }
  };

module.exports = {
    fetchPlans,
    createOrder,
    verifyPayment
}