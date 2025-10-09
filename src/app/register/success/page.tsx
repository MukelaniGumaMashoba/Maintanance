"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Mail, Key, Book, Phone, ArrowRight } from "lucide-react"

export default function SuccessPage() {
  const router = useRouter()
  const [companyData, setCompanyData] = useState<any>(null)
  const [credentials, setCredentials] = useState({
    username: "",
    tempPassword: "",
    loginUrl: "",
  })

  useEffect(() => {
    // Load company data
    const savedData = localStorage.getItem("companySetupData")
    if (savedData) {
      const data = JSON.parse(savedData)
      setCompanyData(data)

      // Generate temporary credentials
      setCredentials({
        username: data.adminEmail,
        tempPassword: "JediFleet2025!",
        loginUrl: `${window.location.origin}/login`,
      })
    }
  }, [])

  const handleGetStarted = () => {
    // Clear registration data
    localStorage.removeItem("registrationData")
    localStorage.removeItem("companySetupData")

    // Redirect to login
    router.push("/login")
  }

  const nextSteps = [
    {
      icon: <Key className="h-5 w-5 text-blue-600" />,
      title: "Login to Your Account",
      description: "Use your temporary credentials to access the system",
      action: "Login Now",
    },
    {
      icon: <Book className="h-5 w-5 text-green-600" />,
      title: "Complete Setup Wizard",
      description: "Follow the guided setup to configure your fleet preferences",
      action: "Start Wizard",
    },
    {
      icon: <Mail className="h-5 w-5 text-purple-600" />,
      title: "Invite Team Members",
      description: "Add your team members and assign appropriate roles",
      action: "Invite Users",
    },
    {
      icon: <Phone className="h-5 w-5 text-orange-600" />,
      title: "Schedule Training",
      description: "Book a training session with our support team",
      action: "Schedule Now",
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Success Header */}
      <div className="text-center mb-12">
        <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Maintanance System!</h1>
        <p className="text-xl text-gray-600 mb-6">
          Your fleet management system has been successfully set up and is ready to use.
        </p>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Account Active
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Account Details */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2 text-blue-600" />
              Your Account Details
            </CardTitle>
            <CardDescription>Use these credentials to access your fleet management system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {companyData && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">Company</label>
                  <p className="font-semibold">{companyData.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Administrator</label>
                  <p className="font-semibold">
                    {companyData.adminFirstName} {companyData.adminLastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Username</label>
                  <p className="font-mono bg-gray-100 p-2 rounded">{credentials.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Temporary Password</label>
                  <p className="font-mono bg-gray-100 p-2 rounded">{credentials.tempPassword}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Login URL</label>
                  <p className="font-mono bg-gray-100 p-2 rounded text-sm">{credentials.loginUrl}</p>
                </div>
              </>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Please change your password after your first login for security.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your System Overview</CardTitle>
            <CardDescription>Here's what's been configured for your fleet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {companyData && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fleet Size:</span>
                  <span className="font-semibold">{companyData.fleetSize} vehicles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Industry:</span>
                  <span className="font-semibold">{companyData.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle Types:</span>
                  <span className="font-semibold">{companyData.vehicleTypes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold">
                    {companyData.city}, {companyData.state}
                  </span>
                </div>
              </>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Activated Features:</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm">Fleet Management Dashboard</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm">Breakdown Call Center</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm">Technician Management</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm">Cost Center & Quotations</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm">Job Management System</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>Follow these steps to get the most out of your fleet management system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 mt-1">{step.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  <Button variant="outline" size="sm">
                    {step.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Our support team is here to help you get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium">Phone Support</h4>
              <p className="text-sm text-gray-600 mb-2">24/7 technical support</p>
              <p className="font-semibold">1-800-MaintainFleet</p>
            </div>
            <div className="text-center">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium">Email Support</h4>
              <p className="text-sm text-gray-600 mb-2">Get help via email</p>
              <p className="font-semibold">support@maintanance.com</p>
            </div>
            <div className="text-center">
              <Book className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium">Documentation</h4>
              <p className="text-sm text-gray-600 mb-2">Comprehensive guides</p>
              <p className="font-semibold">docs.maintain.com</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Get Started Button */}
      <div className="text-center">
        <Button onClick={handleGetStarted} size="lg" className="bg-blue-600 hover:bg-blue-700">
          Access Your Fleet Management System
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
