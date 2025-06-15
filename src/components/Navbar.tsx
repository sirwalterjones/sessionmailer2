'use client';

import { Mail, Camera, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const { user, signOut, loading, resetAuth } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              {/* Logo Icon */}
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
              {/* Small camera accent */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <Camera className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            
            {/* Brand Name */}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                SessionMailer
              </h1>
              <p className="text-xs text-gray-500 -mt-1">
                Email Templates for Photographers
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Home
              </Link>
              {user && (
                <Link 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  Dashboard
                </Link>
              )}
            </nav>

                        {/* Authentication */}
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetAuth}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  Reset Auth
                </Button>
              </div>
            ) : user ? (
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100 cursor-pointer p-0 border-2 border-transparent hover:border-purple-200 transition-all duration-200">
                      <div className="w-9 h-9 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 z-50 shadow-xl border-0 bg-white/95 backdrop-blur-sm" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                    <p className="text-sm font-semibold leading-none text-gray-900">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-xs leading-none text-gray-600">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <div className="p-1">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center px-3 py-2 rounded-md hover:bg-purple-50 transition-colors">
                        <Mail className="mr-3 h-4 w-4 text-purple-600" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center px-3 py-2 rounded-md hover:bg-blue-50 transition-colors">
                        <User className="mr-3 h-4 w-4 text-blue-600" />
                        <span className="font-medium">Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <div className="p-1">
                    <DropdownMenuItem
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer px-3 py-2 rounded-md transition-colors"
                      onClick={() => signOut()}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="font-medium">Sign out</span>
                    </DropdownMenuItem>
                  </div>
                                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="lg" className="text-lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 