import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mail, Check, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <header className="container mx-auto py-6 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">SessionMailer</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Transform Session URLs into Beautiful Email Templates
          </h1>
          <p className="text-xl text-muted-foreground">
            SessionMailer helps photographers create polished marketing emails
            from usesession.com booking URLs in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Try It Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#demo">See Demo</Link>
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <div className="rounded-xl overflow-hidden shadow-xl border bg-card">
            <img
              src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"
              alt="Email template preview"
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="demo" className="bg-muted py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Paste Your URL</h3>
                <p className="text-muted-foreground">
                  Simply paste your usesession.com booking URL into the
                  dashboard.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Generate Template</h3>
                <p className="text-muted-foreground">
                  Our system extracts all relevant information and creates a
                  beautiful email template.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Copy & Send</h3>
                <p className="text-muted-foreground">
                  Copy the HTML with one click and paste it into Mailchimp or
                  any email platform.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-12 flex justify-center">
            <div className="relative w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl border">
              <img
                src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80"
                alt="Dashboard demo"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-8">
                <Button size="lg" asChild>
                  <Link href="/dashboard">Try It Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-muted-foreground text-center mb-12">
          Choose the plan that works for you
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-2 border-muted">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold mb-2">$0</div>
                <p className="text-muted-foreground">Perfect for trying out</p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>1 email per week</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Basic email templates</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Copy to clipboard</span>
                </li>
              </ul>
              <div className="mt-8">
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
              Popular
            </div>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Premium</h3>
                <div className="text-4xl font-bold mb-2">$10</div>
                <p className="text-muted-foreground">per month</p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Unlimited emails</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Premium templates</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Save projects</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Priority support</span>
                </li>
              </ul>
              <div className="mt-8">
                <Button className="w-full" asChild>
                  <Link href="/signup?plan=premium">Get Premium</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Photographers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-5 w-5 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="mb-4">
                  "SessionMailer has saved me hours of work each week. I can now
                  create professional emails for my clients in seconds."
                </p>
                <div className="flex items-center">
                  <div className="rounded-full overflow-hidden w-10 h-10 mr-3">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                      alt="Sarah"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">
                      Portrait Photographer
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-5 w-5 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="mb-4">
                  "The email templates look amazing and my booking rate has
                  increased since I started using SessionMailer for my
                  marketing."
                </p>
                <div className="flex items-center">
                  <div className="rounded-full overflow-hidden w-10 h-10 mr-3">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
                      alt="Michael"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Michael Chen</p>
                    <p className="text-sm text-muted-foreground">
                      Wedding Photographer
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-5 w-5 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="mb-4">
                  "Worth every penny! The premium templates are gorgeous and my
                  clients love the professional look of my emails."
                </p>
                <div className="flex items-center">
                  <div className="rounded-full overflow-hidden w-10 h-10 mr-3">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emily"
                      alt="Emily"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Emily Rodriguez</p>
                    <p className="text-sm text-muted-foreground">
                      Family Photographer
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Streamline Your Email Marketing?
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join photographers who are saving time and booking more clients with
          SessionMailer.
        </p>
        <Button size="lg" asChild>
          <Link href="/dashboard">Get Started Today</Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Mail className="h-5 w-5 text-primary" />
              <span className="font-bold">SessionMailer</span>
            </div>
            <div className="flex space-x-6">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SessionMailer. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
