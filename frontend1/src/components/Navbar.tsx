import { Link } from "react-router-dom";
import { useAuthStore } from "../context/AuthContext";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, LogIn, BarChart, Newspaper, Eye, ShieldCheck } from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="bg-gradient-to-b from-gray-900/95 to-gray-800/90 backdrop-blur-2xl shadow-sm fixed w-full z-50">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        {/* Brand Name with Icon */}
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold mr-6 hover:opacity-90 transition-opacity">
          <ShieldCheck className="h-6 w-6 text-blue-400/90" />
          <span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
            StockSmith
          </span>
        </Link>

        <NavigationMenu className="mx-6 flex-1">
          <NavigationMenuList>
            {isAuthenticated && (
              <>
                <NavigationMenuItem>
                  <Link to="/portfolio">
                    <NavigationMenuLink className={`${navigationMenuTriggerStyle()} flex items-center gap-1.5 bg-transparent text-gray-100/95`}>
                      <BarChart className="h-4 w-4 text-blue-400/90" />
                      <span>Portfolio</span>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/watchlist">
                    <NavigationMenuLink className={`${navigationMenuTriggerStyle()} flex items-center gap-1.5 bg-transparent text-gray-100/95`}>
                      <Eye className="h-4 w-4 text-purple-400/90" />
                      <span>Watchlist</span>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/news">
                    <NavigationMenuLink className={`${navigationMenuTriggerStyle()} flex items-center gap-1.5 bg-transparent text-gray-100/95`}>
                      <Newspaper className="h-4 w-4 text-green-400/90" />
                      <span>News</span>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/subscription">
                    <NavigationMenuLink className={`${navigationMenuTriggerStyle()} flex items-center gap-1.5 bg-transparent text-gray-100/95`}>
                      <Newspaper className="h-4 w-4 text-green-400/90" />
                      <span>Subscription</span>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center space-x-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-gray-100/95 hover:bg-gray-800/40 rounded-full pr-4 backdrop-blur-sm"
                >
                  <Avatar className="h-8 w-8 border-2 border-gray-700/40">
                    <AvatarImage src={user?.email} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-gray-800/50 text-gray-100/95">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-gray-900/95 backdrop-blur-2xl border border-gray-800/40"
              >
                <DropdownMenuLabel className="text-gray-100/95">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800/40" />
                <DropdownMenuItem className="focus:bg-gray-800/50">
                  <Link to="/profile" className="flex items-center gap-2 w-full text-gray-100/95">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-gray-800/50 text-gray-100/95">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-gray-800/50">
                  <Link to="/settings" className="flex items-center gap-2 w-full text-gray-100/95">
                    <div className="h-6 w-6 flex items-center justify-center text-blue-400/90">
                      {/* Settings icon */}
                    </div>
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-800/40" />
                <DropdownMenuItem 
                  onClick={logout} 
                  className="text-red-400/90 focus:bg-red-900/20"
                >
                  <div className="flex items-center gap-2 w-full">
                    {/* Logout icon */}
                    <span>Logout</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="ghost" className="text-gray-100/95 hover:bg-gray-800/40 flex items-center gap-1.5">
                <LogIn className="h-4 w-4 text-blue-400/90" />
                <span>Home</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;