"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface RepairRecord {
  id: number
  job_card_number: string
  description: string
  status: string
  created_at: string
  total_cost: number
  technician_name: string
}

export default function RepairHistory({ vehicleId }: { vehicleId: number }) {
  const [repairs, setRepairs] = useState<RepairRecord[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRepairs = async () => {
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          id,
          job_card_number,
          description,
          status,
          created_at,
          total_cost,
          technicians(name)
        `)
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setRepairs(data.map(item => ({
          ...item,
          technician_name: item.technicians?.name || 'N/A'
        })))
      }
      setLoading(false)
    }

    fetchRepairs()
  }, [vehicleId, supabase])

  if (loading) return <div>Loading repair history...</div>

  if (repairs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No repair history found for this vehicle
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repair History ({repairs.length} records)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Card</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repairs.map((repair) => (
              <TableRow key={repair.id}>
                <TableCell className="font-medium">{repair.job_card_number}</TableCell>
                <TableCell>{repair.description}</TableCell>
                <TableCell>
                  <Badge variant={repair.status === 'completed' ? 'default' : 'secondary'}>
                    {repair.status}
                  </Badge>
                </TableCell>
                <TableCell>{repair.technician_name}</TableCell>
                <TableCell>R {repair.total_cost?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>{new Date(repair.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}