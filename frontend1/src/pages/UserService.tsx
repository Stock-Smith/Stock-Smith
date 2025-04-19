import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CalendarIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from './Home'; // Importing the auth store from Home component

// Animation configurations
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const UserService = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Mock subscription data since we don't have a real backend
  const mockSubscriptionData = {
    free: {
      userId: "user123",
      subscriptionType: "free",
      subscription: {
        status: "active",
        startDate: new Date(2025, 2, 15), // March 15, 2025
        endDate: null,
        currentPlanId: "free_plan_123"
      },
      features: [
        { name: "Basic Market Data", included: true },
        { name: "Limited Analytics", included: true },
        { name: "5 Watchlists", included: true },
        { name: "Daily Market Reports", included: false },
        { name: "AI Predictions", included: false },
        { name: "Premium Research", included: false }
      ]
    },
    premium: {
      userId: "user456",
      subscriptionType: "premium",
      subscription: {
        status: "active",
        startDate: new Date(2025, 1, 10), // Feb 10, 2025
        endDate: new Date(2026, 1, 10), // Feb 10, 2026
        currentPlanId: "premium_plan_456"
      },
      features: [
        { name: "Advanced Market Data", included: true },
        { name: "Full Analytics Suite", included: true },
        { name: "Unlimited Watchlists", included: true },
        { name: "Real-time Market Reports", included: true },
        { name: "AI Predictions & Alerts", included: true },
        { name: "Premium Research Access", included: true }
      ]
    }
  };

  // Plans available for upgrade
  const availablePlans = [
    {
      id: "premium_monthly",
      name: "Premium Monthly",
      price: "$49.99",
      billingCycle: "monthly",
      description: "Full access to all premium features"
    },
    {
      id: "premium_annual",
      name: "Premium Annual",
      price: "$499.99",
      billingCycle: "annual",
      description: "Save 17% with our annual plan",
      popular: true
    }
  ];

  // Simulate fetching subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        // For demo purposes, randomly assign free or premium
        // In a real app, you would use the actual user ID to fetch their subscription
        const mockData = Math.random() > 0.5 ? mockSubscriptionData.free : mockSubscriptionData.premium;
        setSubscription(mockData);
        setError(null);
      } catch (err) {
        setError("Failed to load subscription data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchSubscription();
    }
  }, [isAuthenticated]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle upgrade subscription
  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  // Modal for upgrading subscription
  const UpgradeModal = () => {
    const [selectedPlan, setSelectedPlan] = useState(null);

    const handleConfirmUpgrade = async () => {
      try {
        // This would be an API call in a real application
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update local state to reflect changes
        setSubscription({
          ...mockSubscriptionData.premium,
          subscription: {
            ...mockSubscriptionData.premium.subscription,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          }
        });
        
        setShowUpgradeModal(false);
      } catch (error) {
        setError("Failed to upgrade subscription. Please try again.");
      }
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900/90 backdrop-blur-md rounded-xl border border-white/10 p-6 w-full max-w-2xl"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Upgrade Your Subscription</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {availablePlans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative bg-gray-800/50 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan === plan.id 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                    : 'border-gray-700 hover:border-gray-500'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 -right-2 bg-blue-600">
                    Popular
                  </Badge>
                )}
                <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold text-blue-400 mb-2">{plan.price} <span className="text-sm text-gray-400">/{plan.billingCycle}</span></p>
                <p className="text-gray-400 text-sm">{plan.description}</p>
                {selectedPlan === plan.id && (
                  <CheckCircleIcon className="absolute top-2 right-2 text-blue-500 w-5 h-5" />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={() => setShowUpgradeModal(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!selectedPlan}
              onClick={handleConfirmUpgrade}
            >
              Confirm Upgrade
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-900/20 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
        <AlertCircleIcon className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
        <p className="text-gray-400 text-center max-w-md mb-6">
          You need to be logged in to access your subscription details.
        </p>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Login to Continue
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="max-w-6xl mx-auto"
    >
      <div className="bg-gray-900/20 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-10">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
          <CreditCardIcon className="mr-3 text-blue-400" /> 
          Subscription Management
        </h1>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCwIcon className="w-12 h-12 text-blue-400 animate-spin mb-4" />
            <p className="text-gray-400">Loading your subscription details...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-4 text-center">
            <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-300">{error}</p>
            <Button 
              className="mt-4 bg-red-700 hover:bg-red-800 text-white"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Subscription Overview Card */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl border border-white/10 shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {subscription.subscriptionType === 'premium' ? 'Premium Plan' : 'Free Plan'}
                  </h2>
                  <div className="flex items-center">
                    <Badge className={subscription.subscription.status === 'active' 
                      ? 'bg-green-600/80' 
                      : 'bg-red-600/80'
                    }>
                      {subscription.subscription.status.charAt(0).toUpperCase() + subscription.subscription.status.slice(1)}
                    </Badge>
                    {subscription.subscriptionType === 'premium' && (
                      <p className="text-gray-400 text-sm ml-3">
                        Renews: {formatDate(subscription.subscription.endDate)}
                      </p>
                    )}
                  </div>
                </div>
                
                {subscription.subscriptionType === 'free' && (
                  <Button 
                    className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-600/20"
                    onClick={handleUpgrade}
                  >
                    Upgrade to Premium
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <ShieldCheckIcon className="w-5 h-5 text-blue-400 mr-2" />
                    <h3 className="text-gray-200 font-medium">Plan Type</h3>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {subscription.subscriptionType.charAt(0).toUpperCase() + subscription.subscriptionType.slice(1)}
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CalendarIcon className="w-5 h-5 text-blue-400 mr-2" />
                    <h3 className="text-gray-200 font-medium">Start Date</h3>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {formatDate(subscription.subscription.startDate)}
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <ClockIcon className="w-5 h-5 text-blue-400 mr-2" />
                    <h3 className="text-gray-200 font-medium">
                      {subscription.subscriptionType === 'premium' ? 'Expires' : 'Billing Cycle'}
                    </h3>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {subscription.subscriptionType === 'premium' 
                      ? formatDate(subscription.subscription.endDate)
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Features List */}
            <div className="bg-gray-900/50 rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Included Features</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscription.features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center p-3 border border-gray-800/80 rounded-lg bg-gray-800/30"
                  >
                    {feature.included ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                    )}
                    <span className={feature.included ? "text-white" : "text-gray-500"}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
              
              {subscription.subscriptionType === 'free' && (
                <div className="mt-6 text-center">
                  <p className="text-gray-400 mb-4">
                    Upgrade to Premium to unlock all features and maximize your investment potential.
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    onClick={handleUpgrade}
                  >
                    Upgrade Now
                  </Button>
                </div>
              )}
            </div>
            
            {/* Billing History for Premium users */}
            {subscription.subscriptionType === 'premium' && (
              <div className="bg-gray-900/50 rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Billing History</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left">
                        <th className="pb-3 text-gray-400 font-medium">Date</th>
                        <th className="pb-3 text-gray-400 font-medium">Description</th>
                        <th className="pb-3 text-gray-400 font-medium">Amount</th>
                        <th className="pb-3 text-gray-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-800">
                        <td className="py-3 text-gray-300">Feb 10, 2025</td>
                        <td className="py-3 text-gray-300">Premium Subscription - Annual</td>
                        <td className="py-3 text-white font-medium">$499.99</td>
                        <td className="py-3">
                          <Badge className="bg-green-600/80">Paid</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* FAQ Section */}
      <div className="bg-gray-900/20 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-10">
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">How do I cancel my subscription?</h3>
            <p className="text-gray-400">
              You can cancel your subscription at any time from your account settings. Your premium access will remain active until the end of your current billing period.
            </p>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">What's included in the Premium plan?</h3>
            <p className="text-gray-400">
              Premium subscribers get access to advanced analytics, AI-powered market predictions, unlimited watchlists, real-time alerts, and premium research reports.
            </p>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Can I switch between monthly and annual billing?</h3>
            <p className="text-gray-400">
              Yes, you can switch between billing cycles when your current subscription period ends. The change will take effect at your next billing date.
            </p>
          </div>
        </div>
      </div>
      
      {/* Support Section */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl border border-white/10 p-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Need Help?</h2>
            <p className="text-gray-300 mb-4 md:mb-0">
              Our support team is available 24/7 to assist you with any questions about your subscription.
            </p>
          </div>
          
          <Button 
            className="bg-white text-gray-900 hover:bg-gray-100"
            size="lg"
          >
            Contact Support
          </Button>
        </div>
      </div>
      
      {/* Upgrade Modal */}
      {showUpgradeModal && <UpgradeModal />}
    </motion.div>
  );
};

export default UserService;