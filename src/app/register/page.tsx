"use client"

import type React from "react"

import { useState } from "react"
import { redirect, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, Truck, Phone, BarChart3, Shield, Clock } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    fleetSize: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Store initial data and redirect to company profile setup
    localStorage.setItem("registrationData", JSON.stringify(formData))
    router.push("/register/company")
  }

  const features = [
    {
      icon: <Truck className="h-6 w-6 text-blue-600" />,
      title: "Fleet Management",
      description: "Track and manage your entire vehicle fleet in real-time",
    },
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: "Technician Dispatch",
      description: "Efficiently assign and track technician jobs and breakdowns",
    },
    {
      icon: <Phone className="h-6 w-6 text-blue-600" />,
      title: "Call Center Integration",
      description: "Streamlined call center operations for repair management",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
      title: "Analytics & Reporting",
      description: "Comprehensive insights and reporting for better decision making",
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-600" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee",
    },
    {
      icon: <Clock className="h-6 w-6 text-blue-600" />,
      title: "24/7 Support",
      description: "Round-the-clock customer support and system monitoring",
    },
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "R99",
      period: "/month",
      description: "Perfect for small fleets",
      features: ["Up to 25 vehicles", "Basic repair management", "Call center integration", "Email support"],
      popular: false,
    },
    {
      name: "Professional",
      price: "R299",
      period: "/month",
      description: "Ideal for growing businesses",
      features: [
        "Up to 100 vehicles",
        "Advanced analytics",
        "Technician management",
        "Priority support",
        "Custom reporting",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Unlimited vehicles",
        "Custom integrations",
        "Dedicated support",
        "Advanced security",
        "SLA guarantee",
      ],
      popular: false,
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Transform Your Fleet Management</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Streamline operations, reduce costs, and improve efficiency with our comprehensive fleet management solution
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => document.getElementById("contact-form")?.scrollIntoView()}
          >
            Register Company
          </Button>
          <Button size="lg" variant="outline" onClick={()=>{
            redirect("/register/workshop")
          }}>
            Register Workshop
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose JediFleet Breakdown?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {feature.icon}
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      {/* <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? "border-blue-500 shadow-xl" : "border-gray-200"}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">Most Popular</Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-6 ${plan.popular ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => document.getElementById("contact-form")?.scrollIntoView()}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div> */}

      {/* Contact Form */}
      <div id="contact-form" className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Get Started Today</CardTitle>
            <CardDescription>Fill out the form below and we'll set up your fleet management system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Your Full Name"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fleetSize">Fleet Size</Label>
                <Input
                  id="fleetSize"
                  value={formData.fleetSize}
                  onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                  placeholder="Number of vehicles in your fleet"
                />
              </div>

              <div>
                <Label htmlFor="message">Additional Information</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your specific needs..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                Continue to Company Setup
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500">
        <p>&copy; 2025 JediFleet Breakdown. All rights reserved.</p>
      </footer>
    </div>
  )
}
