import React, { useState, useEffect, useCallback } from 'react';
import { motion } from "framer-motion";
import { Particles } from "react-tsparticles";
import { DollarSign, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentFormState {
  name: string;
  email: string;
  phone: string;
  amount: string;
  isLoading: boolean;
  errorMessage: string;
  successMessage: string;
}

const PaymentForm: React.FC = () => {
  const [state, setState] = useState<PaymentFormState>({
    name: '',
    email: '',
    phone: '',
    amount: '100',
    isLoading: false,
    errorMessage: '',
    successMessage: ''
  });

  // Load Razorpay script safely
  useEffect(() => {
    if (typeof window.Razorpay === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onerror = () => {
        setState(prev => ({
          ...prev,
          errorMessage: 'Failed to load payment gateway'
        }));
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setState(prev => ({ ...prev, [id]: value }));
  };

  const showMessage = useCallback((type: 'success' | 'error', message: string) => {
    setState(prev => ({
      ...prev,
      [`${type}Message`]: message,
      isLoading: false
    }));
    
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, [`${type}Message`]: '' }));
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const initiatePayment = useCallback(async () => {
    const { name, email, phone, amount } = state;
    const abortController = new AbortController();

    if (!name || !email || !phone || !amount) {
      showMessage('error', 'Please fill in all fields');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const orderResponse = await fetch('http://localhost/api/v1/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          notes: { customerName: name, customerEmail: email, customerPhone: phone }
        }),
        signal: abortController.signal
      });

      if (!orderResponse.ok) throw new Error('Failed to create order');

      const orderData = await orderResponse.json();

      const rzpOptions = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Your Company Name",
        description: "Payment for Product/Service",
        order_id: orderData.order.id,
        handler: async (response: any) => {
          await verifyPayment(response);
        },
        prefill: { name, email, contact: phone },
        notes: { orderId: orderData.order.id },
        theme: { color: "#4f46e5" },
        modal: { 
          ondismiss: () => setState(prev => ({ ...prev, isLoading: false }))
        }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();

      rzp.on('payment.failed', (response: any) => {
        showMessage('error', `Payment failed: ${response.error.description}`);
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Payment initiation failed';
      showMessage('error', message);
    }

    return () => abortController.abort();
  }, [state, showMessage]);

  const verifyPayment = useCallback(async (paymentData: any) => {
    const abortController = new AbortController();

    try {
      const verificationResponse = await fetch('/api/v1/subscription/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
        signal: abortController.signal
      });

      if (!verificationResponse.ok) throw new Error('Verification failed');

      const verificationData = await verificationResponse.json();

      if (verificationData.success) {
        showMessage('success', 'Payment successful! Your order has been placed.');
        setState(prev => ({
          ...prev,
          name: '',
          email: '',
          phone: '',
          amount: '100'
        }));
      } else {
        showMessage('error', 'Payment verification failed');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      showMessage('error', message);
    }

    return () => abortController.abort();
  }, [showMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 relative overflow-hidden">
      <Particles
        id="tsparticles"
        className="absolute inset-0 z-0"
        options={{
          particles: {
            number: { value: 50 },
            color: { value: ["#3b82f6", "#8b5cf6", "#10b981"] },
            opacity: { value: 0.3 },
            size: { value: 1 },
            move: {
              enable: true,
              speed: 0.5,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false,
            },
          },
          interactivity: {
            events: {
              onhover: {
                enable: true,
                mode: "repulse",
              },
            },
          },
          retina_detect: true,
        }}
      />

      <div className="w-full max-w-7xl mx-auto p-6 relative z-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gray-800/20 backdrop-blur-xl border border-gray-600/20 shadow-xl rounded-xl overflow-hidden p-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Badge className="bg-indigo-900/30 text-indigo-300 border-indigo-600/30">
                  <Sparkles size={16} className="mr-2" />
                  Secure Payment Gateway
                </Badge>
              </div>
              <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                <DollarSign size={32} className="text-indigo-400" />
                Payment Checkout
              </h2>
              <p className="text-gray-400">Complete your payment with Razorpay</p>
            </div>

            <div className="space-y-6 mt-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="John Doe"
                    value={state.name}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700/20 border border-gray-600/20 rounded-lg px-4 py-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="john@example.com"
                    value={state.email}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700/20 border border-gray-600/20 rounded-lg px-4 py-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    placeholder="+91 98765 43210"
                    value={state.phone}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700/20 border border-gray-600/20 rounded-lg px-4 py-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    min="1"
                    value={state.amount}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700/20 border border-gray-600/20 rounded-lg px-4 py-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                onClick={initiatePayment}
                disabled={state.isLoading}
                className="w-full relative inline-flex items-center justify-center p-4 px-6 py-3 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out rounded-full shadow-xl group hover:ring-1 hover:ring-purple-500"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-700"></span>
                <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-pink-500 rounded-full opacity-30 group-hover:rotate-90 ease"></span>
                <span className="relative text-white flex items-center justify-center gap-2">
                  {state.isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" 
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" 
                          strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Star size={18} className="text-yellow-300" />
                      Pay Now
                    </>
                  )}
                </span>
              </button>

              {state.successMessage && (
                <div className="p-4 rounded-lg bg-green-900/30 border border-green-600/20">
                  <div className="flex items-center gap-3 text-green-300">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{state.successMessage}</span>
                  </div>
                </div>
              )}

              {state.errorMessage && (
                <div className="p-4 rounded-lg bg-red-900/30 border border-red-600/20">
                  <div className="flex items-center gap-3 text-red-300">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{state.errorMessage}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <style>
        {`
          @keyframes gradientPulse {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .shadow-glow-blue {
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
          }
        `}
      </style>
    </div>
  );
};

export default PaymentForm;