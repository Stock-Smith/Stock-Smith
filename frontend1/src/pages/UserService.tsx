import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Shield, LifeBuoy, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Feature {
  dailyPredictionLimit: number;
}

interface Price {
  amount: number;
  currency: string;
  billingCycle: string;
}

interface Plan {
  _id: string;
  name: string;
  type: string;
  isActive: boolean;
  price: Price;
  features: Feature;
}

interface PlansResponse {
  success: boolean;
  plans: Plan[];
}

const UserSubscription: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch('http://localhost/api/v1/subscription/fetch-plans', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch subscription plans');
        }

        const data: PlansResponse = await response.json();
        
        if (data.success && data.plans) {
          setPlans(data.plans.filter(plan => plan.isActive));
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = (planId: string, amount: number) => {
    navigate(`/payment?planId=${planId}&amount=${amount}`);
  };

  const formatPrice = (amount: number, currency: string): string => {
    if (amount === 0) return 'Free';
    
    // Format for Indian Rupees
    if (currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    
    return `${amount} ${currency}`;
  };

  const getFeatureDescription = (limit: number): string => {
    if (limit === -1) return 'Unlimited predictions';
    return `${limit} predictions per day`;
  };

  const getPlanBadge = (type: string) => {
    switch (type) {
      case 'free':
        return <Badge className="bg-blue-900/30 text-blue-300 border-blue-600/30">Free</Badge>;
      case 'premium':
        return <Badge className="bg-purple-900/30 text-purple-300 border-purple-600/30">Premium</Badge>;
      default:
        return null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Choose Your Subscription Plan
          </motion.h1>
          <motion.p 
            className="text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Select the plan that works best for you and unlock powerful prediction capabilities
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-600/40 p-6 rounded-lg text-center">
            <p className="text-red-300">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-700/50 hover:bg-red-700/70 rounded-md text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {plans.map((plan) => (
              <motion.div 
                key={plan._id}
                variants={itemVariants}
                className={`
                  bg-gray-800/40 backdrop-blur-sm border rounded-xl overflow-hidden shadow-xl transition-all duration-300
                  ${plan.type === 'premium' ? 'border-indigo-500/30 shadow-indigo-900/20 hover:shadow-indigo-900/30' : 'border-gray-700/40 hover:border-gray-600/60'}
                `}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                      {getPlanBadge(plan.type)}
                    </div>
                    {plan.type === 'premium' && (
                      <div className="flex items-center gap-1">
                        <Shield size={16} className="text-indigo-400" />
                        <span className="text-xs text-indigo-400">Premium</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">
                        {formatPrice(plan.price.amount, plan.price.currency)}
                      </span>
                      {plan.price.amount > 0 && (
                        <span className="text-gray-400 ml-2">
                          /{plan.price.billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      )}
                    </div>
                    {plan.price.billingCycle === 'annually' && plan.price.amount > 0 && (
                      <p className="text-green-400 text-sm mt-1">Save 17% with annual billing</p>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-start gap-3">
                      {plan.features.dailyPredictionLimit === -1 ? (
                        <Check size={18} className="text-green-400 mt-0.5" />
                      ) : (
                        <span className="w-5 h-5 text-center text-xs bg-blue-900/30 text-blue-300 rounded-full flex items-center justify-center mt-0.5">
                          {plan.features.dailyPredictionLimit}
                        </span>
                      )}
                      <span>{getFeatureDescription(plan.features.dailyPredictionLimit)}</span>
                    </div>
                    
                    {plan.type === 'premium' ? (
                      <>
                        <div className="flex items-start gap-3">
                          <Check size={18} className="text-green-400 mt-0.5" />
                          <span>Priority customer support</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <Check size={18} className="text-green-400 mt-0.5" />
                          <span>Advanced analytics</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <X size={18} className="text-gray-500 mt-0.5" />
                          <span className="text-gray-500">Priority customer support</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <X size={18} className="text-gray-500 mt-0.5" />
                          <span className="text-gray-500">Advanced analytics</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleSelectPlan(plan._id, plan.price.amount)}
                    className={`
                      w-full py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2
                      ${plan.type === 'premium' 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-white'}
                    `}
                  >
                    <CreditCard size={18} />
                    {plan.price.amount === 0 ? 'Continue with Free' : 'Select Plan'}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <LifeBuoy size={20} className="text-indigo-400" />
            <h3 className="text-lg font-medium text-gray-300">Need help choosing?</h3>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Contact our customer support team for guidance on selecting the right plan for your needs.
          </p>
          <a 
            href="mailto:support@example.com" 
            className="inline-block mt-4 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            support@example.com
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default UserSubscription;