import MaintenanceDashboard from '@/components/workshop/MaintenanceDashboard'

export default function MaintenancePage() {
  return (
    <div className="container mx-auto py-6">
      <MaintenanceDashboard />
    </div>
  )
}

export const metadata = {
  title: 'Maintenance Management',
  description: 'Manage job cards, parts, and maintenance workflows'
}