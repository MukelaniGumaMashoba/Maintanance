"use client"
import type React from "react"
import { Inter } from "next/font/google"
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] })

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [isMenuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`${inter.className} min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100`}>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Maintanance</h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="/login" className="text-gray-500 hover:text-gray-700">
                Already have an account? Sign in
              </a>
            </div>

            {/* Mobile Toggle Button */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setMenuOpen(!isMenuOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d={isMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden px-4 pb-4">
            <a href="/login" className="block text-gray-500 hover:text-gray-700">
              Already have an account? Sign in
            </a>
          </div>
        )}
      </nav>
      <main>{children}</main>
    </div>
  )
}
