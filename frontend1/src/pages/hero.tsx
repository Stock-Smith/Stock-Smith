import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { LineChartIcon, TrendingUpIcon, EyeIcon, LogInIcon, UserPlusIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuthStore } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface HeroProps {
  onScrollClick?: () => void;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const bounceAnimation = {
  y: [0, -10, 0],
  transition: {
    y: {
      repeat: Infinity,
      duration: 1.5,
      ease: "easeInOut"
    }
  }
};

const HeroSection: React.FC<HeroProps> = ({ onScrollClick }) => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  const handleSignUp = () => {
    navigate('/register');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const handlePortfolio = () => {
    navigate('/portfolio');
  };

  const handleWatchlist = () => {
    navigate('/watchlist');
  };

// Replace your existing scrollToNextSection function with this:
const scrollToNextSection = () => {
  if (onScrollClick) {
    onScrollClick();
  } else {
    // Simple fallback: scroll by viewport height
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  }
};



  return (
    <div 
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.h1 
            variants={fadeIn} 
            className="text-5xl md:text-6xl font-bold text-white"
          >
            AI-Powered Market
          </motion.h1>
          
          <motion.div variants={fadeIn} className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            <TypeAnimation
              sequence={[
                'Harness the power of AI to predict market trends and make informed investment decisions.',
                2000
              ]}
              speed={50}
              repeat={Infinity}
            />
          </motion.div>
          
          <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4 mt-8">
            {!isAuthenticated ? (
              <>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={handleSignUp}>
                  <UserPlusIcon className="mr-2 h-5 w-5" />
                  Sign Up
                </Button>
                <Button size="lg" variant="outline" className="border-blue-400 text-blue-700" onClick={handleSignIn}>
                  <LogInIcon className="mr-2 h-5 w-5" />
                  Sign In
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={handlePortfolio}>
                  <LineChartIcon className="mr-2 h-5 w-5" />
                  Analyze Portfolio
                </Button>
                <Button size="lg" variant="outline" className="border-blue-400 text-blue-700" onClick={handleWatchlist}>
                  <EyeIcon className="mr-2 h-5 w-5" />
                  Explore Watchlist
                </Button>
              </>
            )}
          </motion.div>
          
          {isAuthenticated && user && (
            <motion.div 
              variants={fadeIn}
              className="mt-8 flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="mt-2 text-blue-100">
                Welcome back
              </div>
              <div className="text-xl font-semibold text-white">
                {user.name}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
      
      {/* Down arrow button at the bottom */}
      <motion.div 
        className="absolute bottom-10 cursor-pointer"
        onClick={scrollToNextSection}
        animate={bounceAnimation}
        whileHover={{ scale: 1.2 }}
      >
        <div className="p-3 rounded-full bg-blue-600/30 backdrop-blur-sm hover:bg-blue-600/50 transition-colors">
          <ChevronDownIcon className="h-8 w-8 text-white" />
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
