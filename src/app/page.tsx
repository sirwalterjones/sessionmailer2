// Updated: Fixed redirect loop and added subscription page - 2025-06-28
// Updated: Fixed admin dashboard authentication - 2025-06-28
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mail, Check, Star, Camera, Sparkles, Palette, Clock, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Professional Email Templates
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Transform Your{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Photo Sessions
            </span>
            <br />
            Into Beautiful Emails
          </h1>
          
          <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            SessionMailer automatically converts your usesession.com photo sessions into 
            professional, customizable email templates. Perfect for photographers who want 
            to impress their clients with stunning email presentations.
          </p>
          
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-purple-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1">
                  💰 Simple Pricing
                </Badge>
                <div className="text-center">
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    $10
                  </span>
                  <span className="text-gray-600 ml-1">/month</span>
                </div>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    Unlimited templates
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    Full customization
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
              <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Professional Email Templates
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From URL to stunning email in seconds. Customize colors, fonts, and branding to match your photography business.
            </p>
                </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Instant Generation</CardTitle>
                <CardDescription>
                  Simply paste your usesession.com URL and get a beautiful email template in seconds
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Full Customization</CardTitle>
                <CardDescription>
                  Customize colors, fonts, and styling to perfectly match your brand and photography style
                </CardDescription>
              </CardHeader>
            </Card>



            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Email Ready</CardTitle>
                <CardDescription>
                  Export HTML that works perfectly in all major email clients and platforms
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Multiple Sessions</CardTitle>
                <CardDescription>
                  Combine multiple photo sessions into a single comprehensive email template
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Professional Design</CardTitle>
                <CardDescription>
                  Beautiful, modern templates that make your photography work shine and impress clients
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-green-100 text-green-700 hover:bg-green-200">
            <Star className="h-3 w-3 mr-1" />
            Simple & Affordable
          </Badge>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            One Simple Price for Everything
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            No hidden fees, no complicated tiers. Get access to all features for one low monthly price.
          </p>
          
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-purple-200 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-blue-600"></div>
              <CardHeader className="text-center py-8">
                <div className="text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">$10</span>
                  <span className="text-2xl text-gray-500 font-normal">/month</span>
                </div>
                <CardTitle className="text-2xl">Professional Plan</CardTitle>
                <CardDescription className="text-lg">Everything you need to create stunning email templates</CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-8">
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Unlimited email templates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Full color & font customization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Multiple sessions per email</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Save & manage projects</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">Email-ready HTML export</span>
                  </div>
                </div>
                
                <Link href="/auth/signup">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 text-lg">
                    Start Your $10/Month Plan
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <p className="text-sm text-gray-500 mt-4">
                  🔒 Secure PayPal billing • Cancel anytime • No contracts
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Photo Sessions?
        </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join photographers who are already creating stunning email templates with SessionMailer
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3">
              Start Creating Now
              <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <Camera className="h-2 w-2 text-white" />
            </div>
            </div>
            <span className="text-xl font-bold">SessionMailer</span>
          </div>
          <p className="text-gray-400">
            Professional email templates for photographers • Built with ❤️ for the photography community
          </p>
        </div>
      </footer>
    </div>
  );
}
