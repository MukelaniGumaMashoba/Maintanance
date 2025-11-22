// Simple route mapping for reports
export const reportRoutes = {
  'fleet-management': '/reports/vehicles/fleet-management',
  'operations': '/reports/workshop/operations', 
  'job-cards': '/reports/workshop/job-cards',
  'management': '/reports/personnel/management',
  'parts-tracking': '/reports/inventory/parts-tracking',
  'stock-management': '/reports/inventory/stock-management',
  'stock-orders': '/reports/inventory/stock-orders',
  'parts-orders': '/reports/inventory/parts-orders',
  'analysis': '/reports/financial/analysis',
  'suppliers': '/reports/procurement/suppliers'
}

export function getReportRoute(slug: string): string {
  return reportRoutes[slug as keyof typeof reportRoutes] || `/reports/${slug}`
}