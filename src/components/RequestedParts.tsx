"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

interface Part {
  id: number
  part_name?: string
  quantity?: number
  status?: string
  created_at?: string
  item_code?: string
  description?: string
  price?: number
  total_cost?: number
}

export default function RequestedParts({ jobId }: { jobId: number }) {
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchParts = async () => {
      if (!jobId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('workshop_job_parts')
          .select('*')
          .eq('workshop_job_id', jobId)
          .order('created_at', { ascending: false })

        if (!error && data) {
          // Ensure data is properly structured
          const validParts = data.filter(part => part && typeof part === 'object')
          setParts(validParts)
        } else {
          // Table might not exist yet, just set empty array
          setParts([])
        }
      } catch (err) {
        // Handle case where table doesn't exist
        console.log('Parts table not found, skipping parts fetch')
        setParts([])
      }
      setLoading(false)
    }

    fetchParts()
  }, [jobId, supabase])

  if (loading) return <div className="text-sm text-gray-500">Loading parts...</div>

  if (parts.length === 0) {
    return (
      <div className="border-t pt-3">
        <p className="text-sm font-medium text-gray-600 mb-2">Requested Parts:</p>
        <p className="text-sm text-gray-500">No parts requested yet</p>
      </div>
    )
  }

  return (
    <div className="border-t pt-3">
      <p className="text-sm font-medium text-gray-600 mb-2">Requested Parts ({parts.length}):</p>
      <div className="flex flex-wrap gap-2">
        {parts.map((part) => {
          // Safely extract part information
          const partName = part.part_name || part.description || part.item_code || 'Unknown Part'
          const quantity = part.quantity || 1
          const price = part.price || part.total_cost
          
          return (
            <Badge 
              key={part.id} 
              variant="outline" 
              className="text-xs"
            >
              {partName} (x{quantity})
              {price && ` - R${price}`}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}