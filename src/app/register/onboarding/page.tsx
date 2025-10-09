"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Settings, Users, Truck, Phone } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [companyData, setCompanyData] = useState<any>(null)

  const onboardingSteps = [
    {
      id: "account",
      title: "Creating Your Account",
      description: "Setting up your company profile and admin access",
      icon: <Settings className="h-6 w-6" />,
      duration: 3000,
    },
    {
      id: "fleet",
      title: "Configuring Fleet Settings",
      description: "Initializing vehicle management and tracking systems",
      icon: <Truck className="h-6 w-6" />,
      duration: 4000,
    },
    {
      id: "users",
      title: "Setting Up User Roles",
      description: "Creating user permissions and access levels",
      icon: <Users className="h-6 w-6" />,
      duration: 2500,
    },
    {
      id: "callcenter",
      title: "Initializing Call Center",
      description: "Setting up repair management and dispatch system",
      icon: <Phone className="h-6 w-6" />,
      duration: 3500,
    },
  ]

  useEffect(() => {
    // Load company setup data
    const savedData = localStorage.getItem("companySetupData")
    if (savedData) {
      setCompanyData(JSON.parse(savedData))
    }

    // Simulate onboarding process
    const processSteps = async () => {
      for (let i = 0; i < onboardingSteps.length; i++) {
        setCurrentStep(i)
        await new Promise((resolve) => setTimeout(resolve, onboardingSteps[i].duration))
      }

      // Complete onboarding
      setCurrentStep(onboardingSteps.length)

      // Redirect to success page after a brief delay
      setTimeout(() => {
        router.push("/register/success")
      }, 2000)
    }

    processSteps()
  }, [router])

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Setting Up Your Fleet Management System</CardTitle>
          <CardDescription>
            We're configuring your system based on your company profile. This will take just a few moments.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {companyData && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Company Setup Complete</h3>
              <div className="space-y-1 text-sm">
                <p className="text-blue-700"><strong>Company:</strong> {companyData.companyName}</p>
                <p className="text-blue-700"><strong>Fleet Size:</strong> {companyData.fleetSize} vehicles</p>
                <p className="text-blue-700"><strong>Industry:</strong> {companyData.industry}</p>
                {companyData.adminCredentials && (
                  <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-green-800 font-medium mb-1">Admin Account Created:</p>
                    <p className="text-green-700"><strong>Email:</strong> {companyData.adminCredentials.email}</p>
                    <p className="text-green-700"><strong>Temporary Password:</strong> {companyData.adminCredentials.tempPassword}</p>
                    <p className="text-green-600 text-xs mt-1">Please save these credentials. You can change the password after first login.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {onboardingSteps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-4 p-4 rounded-lg border">
                <div
                  className={`flex-shrink-0 ${
                    index < currentStep ? "text-green-600" : index === currentStep ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : index === currentStep ? (
                    <div className="animate-spin">
                      <Clock className="h-6 w-6" />
                    </div>
                  ) : (
                    step.icon
                  )}
                </div>

                <div className="flex-1">
                  <h4
                    className={`font-medium ${
                      index < currentStep ? "text-green-900" : index === currentStep ? "text-blue-900" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p
                    className={`text-sm ${
                      index < currentStep ? "text-green-700" : index === currentStep ? "text-blue-700" : "text-gray-400"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {index < currentStep && <span className="text-green-600 text-sm font-medium">Complete</span>}
                  {index === currentStep && <span className="text-blue-600 text-sm font-medium">Processing...</span>}
                </div>
              </div>
            ))}
          </div>

          {currentStep >= onboardingSteps.length && (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">Setup Complete!</h3>
              <p className="text-green-700">Your fleet management system is ready to use.</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What's happening:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Creating secure database for your fleet data</li>
              <li>• Setting up user authentication and permissions</li>
              <li>• Configuring repair management workflows</li>
              <li>• Initializing reporting and analytics tools</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
