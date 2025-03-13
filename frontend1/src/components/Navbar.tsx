import { Link } from "react-router-dom";
import { useAuthStore } from "../context/AuthContext";

// Import shadcn UI components
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
import { ChevronDown, LogIn, UserPlus, BarChart, Newspaper, Eye, ShieldCheck } from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="border-b bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        {/* Brand Name with Icon */}
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold mr-6 hover:opacity-90 transition-opacity">
          <ShieldCheck className="h-6 w-6" />
          <span>StockSmith</span>
        </Link>

        <NavigationMenu className="mx-6 flex-1">
          <NavigationMenuList>
            {isAuthenticated && (
              <>
                <NavigationMenuItem>
                  <Link to="/portfolio">
                    <NavigationMenuLink className={`${navigationMenuTriggerStyle()} flex items-center gap-1.5`}>
                      <BarChart className="text-black h-4 w-4" />
                      <span class ='text-black'>Portfolio</span>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/watchlist">
                    <NavigationMenuLink className={`${navigationMenuTriggerStyle()} flex items-center gap-1.5`}>
                      <Eye className="text-black h-4 w-4" />
                      <span class ='text-black'>Watchlist</span>
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
                  className="flex items-center gap-2 text-white hover:bg-blue-700 hover:text-white rounded-full pr-4"
                >
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage src={user?.email} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-blue-800 text-white">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                    <div className="h-6 w-6 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.07095 0.650238C6.67391 0.650238 6.32977 0.925096 6.24198 1.31231L6.0039 2.36247C5.6249 2.47269 5.26335 2.62363 4.92436 2.8115L4.01335 2.23151C3.67748 2.02201 3.24927 2.07848 2.97926 2.34849L2.34849 2.97926C2.07848 3.24927 2.02201 3.67748 2.23151 4.01335L2.8115 4.92436C2.62363 5.26335 2.47269 5.6249 2.36247 6.0039L1.31231 6.24198C0.925096 6.32977 0.650238 6.67391 0.650238 7.07095V7.92905C0.650238 8.32609 0.925096 8.67023 1.31231 8.75802L2.36247 8.9961C2.47269 9.3751 2.62363 9.73665 2.8115 10.0756L2.23151 10.9866C2.02201 11.3225 2.07848 11.7507 2.34849 12.0207L2.97926 12.6515C3.24927 12.9215 3.67748 12.978 4.01335 12.7685L4.92436 12.1885C5.26335 12.3764 5.6249 12.5273 6.0039 12.6375L6.24198 13.6877C6.32977 14.0749 6.67391 14.3498 7.07095 14.3498H7.92905C8.32609 14.3498 8.67023 14.0749 8.75802 13.6877L8.9961 12.6375C9.3751 12.5273 9.73665 12.3764 10.0756 12.1885L10.9866 12.7685C11.3225 12.978 11.7507 12.9215 12.0207 12.6515L12.6515 12.0207C12.9215 11.7507 12.978 11.3225 12.7685 10.9866L12.1885 10.0756C12.3764 9.73665 12.5273 9.3751 12.6375 8.9961L13.6877 8.75802C14.0749 8.67023 14.3498 8.32609 14.3498 7.92905V7.07095C14.3498 6.67391 14.0749 6.32977 13.6877 6.24198L12.6375 6.0039C12.5273 5.6249 12.3764 5.26335 12.1885 4.92436L12.7685 4.01335C12.978 3.67748 12.9215 3.24927 12.6515 2.97926L12.0207 2.34849C11.7507 2.07848 11.3225 2.02201 10.9866 2.23151L10.0756 2.8115C9.73665 2.62363 9.3751 2.47269 8.9961 2.36247L8.75802 1.31231C8.67023 0.925096 8.32609 0.650238 7.92905 0.650238H7.07095ZM4.92436 3.9847C5.41255 3.70089 5.96527 3.5 6.5 3.5C8.15685 3.5 9.5 4.84315 9.5 6.5C9.5 8.15685 8.15685 9.5 6.5 9.5C4.84315 9.5 3.5 8.15685 3.5 6.5C3.5 5.96527 3.70089 5.41255 3.9847 4.92436L3.98469 4.92436C4.29862 4.41042 4.41042 4.29862 4.92436 3.98469L4.92436 3.9847ZM5.84948 5.52876C5.68773 5.68582 5.58098 5.89079 5.54517 6.11372C5.50935 6.33666 5.54615 6.56494 5.65083 6.76471C5.75551 6.96449 5.9225 7.12465 6.12598 7.22152C6.32946 7.31839 6.558 7.34673 6.7796 7.30224C7.0012 7.25775 7.20321 7.14292 7.35457 6.97285C7.50594 6.80279 7.5929 6.58994 7.60151 6.36866C7.61011 6.14738 7.53993 5.92758 7.40367 5.74731C7.26741 5.56704 7.07219 5.43751 6.85 5.375C6.70354 5.33357 6.54958 5.32811 6.40035 5.35911C6.25112 5.39011 6.11098 5.45667 5.98961 5.55475C5.86824 5.65283 5.76896 5.77978 5.69997 5.92603C5.63099 6.07229 5.59416 6.23363 5.59229 6.39806C5.5913 6.48356 5.60514 6.56875 5.63329 6.65018C5.66143 6.73161 5.70344 6.80799 5.75745 6.87591C5.81147 6.94384 5.87654 7.00229 5.94963 7.04882C6.02272 7.09534 6.10269 7.12911 6.18633 7.14858C6.26997 7.16806 6.35593 7.17297 6.44083 7.16314C6.52574 7.1533 6.60839 7.12883 6.68508 7.09069C6.76178 7.05256 6.83117 7.00143 6.89004 6.93972C6.94892 6.87801 6.99631 6.80679 7.02976 6.72953L7.02976 6.72953C7.06244 6.65373 7.08115 6.5731 7.08506 6.49084C7.08897 6.40858 7.07801 6.32618 7.05271 6.2478C7.0274 6.16943 6.98819 6.09626 6.93696 6.0316C6.88574 5.96693 6.8234 5.91175 6.75289 5.86877C6.68238 5.82579 6.60477 5.7957 6.5225 5.78005C6.44023 5.7644 6.35546 5.76344 6.27271 5.77722C6.18996 5.79099 6.11059 5.8193 6.03848 5.8609C5.96636 5.9025 5.90265 5.95677 5.84948 6.02124L5.84948 5.52876Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout} 
                  className="text-red-500 cursor-pointer focus:text-red-500 focus:bg-red-50"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-6 w-6 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 1C2.44771 1 2 1.44772 2 2V13C2 13.5523 2.44772 14 3 14H10.5C10.7761 14 11 13.7761 11 13.5C11 13.2239 10.7761 13 10.5 13H3V2L10.5 2C10.7761 2 11 1.77614 11 1.5C11 1.22386 10.7761 1 10.5 1H3ZM12.6036 4.89645C12.4083 4.70118 12.0917 4.70118 11.8964 4.89645C11.7012 5.09171 11.7012 5.40829 11.8964 5.60355L13.2929 7H6.5C6.22386 7 6 7.22386 6 7.5C6 7.77614 6.22386 8 6.5 8H13.2929L11.8964 9.39645C11.7012 9.59171 11.7012 9.90829 11.8964 10.1036C12.0917 10.2988 12.4083 10.2988 12.6036 10.1036L14.8536 7.85355C14.9473 7.75979 15 7.63261 15 7.5C15 7.36739 14.9473 7.24021 14.8536 7.14645L12.6036 4.89645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <span>Logout</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/v1/auth/login">
                <Button variant="ghost" className="text-white hover:bg-blue-700 flex items-center gap-1.5">
                <LogIn className="h-4 w-4" />
                  <span>Home</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;