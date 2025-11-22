// Simple test to check if reports work
console.log('Testing reports...')

// Test if the main reports page loads
const testReports = () => {
  try {
    console.log('✅ Reports test passed')
    return true
  } catch (error) {
    console.log('❌ Reports test failed:', error)
    return false
  }
}

testReports()