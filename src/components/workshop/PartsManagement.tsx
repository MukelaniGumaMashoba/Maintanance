"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Plus, 
  Package, 
  AlertTriangle, 
  ExternalLink,
  Trash2,
  Edit
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Part {
  id: number
  item_code: string
  description: string
  price: number
  quantity: number
  stock_threshold: number
  is_stock_item: boolean
  supplier: string
  location: string
}

interface NonStockPart {
  id: number
  job_card_id: string
  part_name: string
  part_number: string
  description: string
  quantity: number
  unit_cost: number
  total_cost: number
  supplier: string
  is_external_workshop: boolean
  created_at: string
}

interface PartsFormData {
  item_code: string
  description: string
  price: number
  quantity: number
  stock_threshold: number
  is_stock_item: boolean
  supplier: string
  location: string
}

interface NonStockFormData {
  job_card_id: string
  part_name: string
  part_number: string
  description: string
  quantity: number
  unit_cost: number
  supplier: string
  is_external_workshop: boolean
}

export default function PartsManagement() {
  const [parts, setParts] = useState<Part[]>([])
  const [nonStockParts, setNonStockParts] = useState<NonStockPart[]>([])
  const [jobCards, setJobCards] = useState<any[]>([])
  const [showAddPart, setShowAddPart] = useState(false)
  const [showAddNonStock, setShowAddNonStock] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [activeTab, setActiveTab] = useState<'stock' | 'non-stock'>('stock')
  
  const [partsForm, setPartsForm] = useState<PartsFormData>({
    item_code: "",
    description: "",
    price: 0,
    quantity: 0,
    stock_threshold: 10,
    is_stock_item: true,
    supplier: "",
    location: ""
  })

  const [nonStockForm, setNonStockForm] = useState<NonStockFormData>({
    job_card_id: "",
    part_name: "",
    part_number: "",
    description: "",
    quantity: 1,
    unit_cost: 0,
    supplier: "",
    is_external_workshop: false
  })

  const supabase = createClient()

  useEffect(() => {
    fetchParts()
    fetchNonStockParts()
    fetchJobCards()
  }, [])

  const fetchParts = async () => {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .order('description')

    if (!error && data) {
      setParts(data as any)
    }
  }

  const fetchNonStockParts = async () => {
    const { data, error } = await supabase
      .from('once_offparts')
      .select(`
        *      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setNonStockParts(data as any)
    }
  }

  const fetchJobCards = async () => {
    const { data, error } = await supabase
      .from('workshop_job')
      .select('id, jobId_workshop, registration_no, status')
      .in('status', ['Awaiting Approval', 'Approved - Ready for Parts Assignment', 'Part Assigned', 'Part Ordered'])
      .order('jobId_workshop')

    if (!error && data) {
      // Map workshop_job data to match expected format
      setJobCards(data.map(job => ({
        id: job.id,
        job_number: job.jobId_workshop,
        vehicle_registration: job.registration_no,
        status: job.status
      })))
    }
  }

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase
        .from('parts')
        .insert([partsForm])

      if (error) throw error

      toast.success("Part added successfully")
      setPartsForm({
        item_code: "",
        description: "",
        price: 0,
        quantity: 0,
        stock_threshold: 10,
        is_stock_item: true,
        supplier: "",
        location: ""
      })
      setShowAddPart(false)
      fetchParts()

    } catch (error) {
      console.error('Error adding part:', error)
      toast.error("Failed to add part")
    }
  }

  const handleUpdatePart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPart) return

    try {
      const { error } = await supabase
        .from('parts')
        .update(partsForm)
        .eq('id', editingPart.id)

      if (error) throw error

      toast.success("Part updated successfully")
      setEditingPart(null)
      setShowAddPart(false)
      fetchParts()

    } catch (error) {
      console.error('Error updating part:', error)
      toast.error("Failed to update part")
    }
  }

  const handleAddNonStockPart = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase
        .from('once_offparts')
        .insert([nonStockForm])

      if (error) throw error

      toast.success("Once-off part added successfully")
      setNonStockForm({
        job_card_id: "",
        part_name: "",
        part_number: "",
        description: "",
        quantity: 1,
        unit_cost: 0,
        supplier: "",
        is_external_workshop: false
      })
      setShowAddNonStock(false)
      fetchNonStockParts()

    } catch (error) {
      console.error('Error adding once-off part:', error)
      toast.error("Failed to add once-off part")
    }
  }

  const handleDeletePart = async (partId: number) => {
    if (!confirm("Are you sure you want to delete this part?")) return

    try {
      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', partId)

      if (error) throw error

      toast.success("Part deleted successfully")
      fetchParts()

    } catch (error) {
      console.error('Error deleting part:', error)
      toast.error("Failed to delete part")
    }
  }

  const handleDeleteNonStockPart = async (partId: number) => {
    if (!confirm("Are you sure you want to delete this once-off part?")) return

    try {
      const { error } = await supabase
        .from('once_offparts')
        .delete()
        .eq('id', partId)

      if (error) throw error

      toast.success("Once-off part deleted successfully")
      fetchNonStockParts()

    } catch (error) {
      console.error('Error deleting once-off part:', error)
      toast.error("Failed to delete once-off part")
    }
  }

  const startEditPart = (part: Part) => {
    setEditingPart(part)
    setPartsForm({
      item_code: part.item_code || "",
      description: part.description || "",
      price: part.price || 0,
      quantity: part.quantity || 0,
      stock_threshold: part.stock_threshold || 10,
      is_stock_item: part.is_stock_item ?? true,
      supplier: part.supplier || "",
      location: part.location || ""
    })
    setShowAddPart(true)
  }

  const isLowStock = (part: Part) => {
    return part.quantity <= part.stock_threshold
  }

  const getLowStockParts = () => {
    return parts.filter(isLowStock)
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {getLowStockParts().length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Low Stock Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-2">
              {getLowStockParts().length} part(s) are below threshold:
            </p>
            <div className="flex flex-wrap gap-2">
              {getLowStockParts().map((part) => (
                <Badge key={part.id} variant="destructive">
                  {part.description} ({part.quantity}/{part.stock_threshold})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'stock' 
              ? 'bg-white shadow-sm text-blue-600' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('stock')}
        >
          <Package className="h-4 w-4 inline mr-2" />
          Stock Parts
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'non-stock' 
              ? 'bg-white shadow-sm text-blue-600' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('non-stock')}
        >
          <ExternalLink className="h-4 w-4 inline mr-2" />
          Once-Off Parts
        </button>
      </div>

      {/* Stock Parts Tab */}
      {activeTab === 'stock' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Stock Parts Management</CardTitle>
              <Button onClick={() => setShowAddPart(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {parts.map((part) => (
                <Card key={part.id} className={`p-4 ${isLowStock(part) ? 'border-orange-300 bg-orange-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold">{part.description}</h3>
                        <Badge variant={part.is_stock_item ? "default" : "secondary"}>
                          {part.is_stock_item ? "Stock Item" : "Non-Stock"}
                        </Badge>
                        {isLowStock(part) && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Stock
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p><strong>Code:</strong> {part.item_code}</p>
                          <p><strong>Price:</strong> R{part.price}</p>
                        </div>
                        <div>
                          <p><strong>Quantity:</strong> {part.quantity}</p>
                          <p><strong>Threshold:</strong> {part.stock_threshold}</p>
                        </div>
                        <div>
                          <p><strong>Supplier:</strong> {part.supplier}</p>
                          <p><strong>Location:</strong> {part.location}</p>
                        </div>
                        <div>
                          <p><strong>Total Value:</strong> R{(part.price * part.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditPart(part)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePart(part.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-Stock Parts Tab */}
      {activeTab === 'non-stock' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Once-Off Parts</CardTitle>
              <Button onClick={() => setShowAddNonStock(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Once-Off Part
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {nonStockParts.map((part) => (
                <Card key={part.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold">{part.part_name}</h3>
                        <Badge variant={part.is_external_workshop ? "secondary" : "default"}>
                          {part.is_external_workshop ? "External Workshop" : "One-off Purchase"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p><strong>Part Number:</strong> {part.part_number}</p>
                          <p><strong>Job Card:</strong> {part.job_cards?.job_number}</p>
                        </div>
                        <div>
                          <p><strong>Quantity:</strong> {part.quantity}</p>
                          <p><strong>Unit Cost:</strong> R{part.unit_cost}</p>
                        </div>
                        <div>
                          <p><strong>Total Cost:</strong> R{part.total_cost}</p>
                          <p><strong>Supplier:</strong> {part.supplier}</p>
                        </div>
                        <div>
                          <p><strong>Vehicle:</strong> {part.job_cards?.vehicle_registration}</p>
                          <p><strong>Added:</strong> {new Date(part.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {part.description && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>Description:</strong> {part.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteNonStockPart(part.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Stock Part Modal */}
      {showAddPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingPart ? 'Edit Part' : 'Add New Part'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingPart ? handleUpdatePart : handleAddPart} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="item_code">Item Code *</Label>
                    <Input
                      id="item_code"
                      value={partsForm.item_code}
                      onChange={(e) => setPartsForm({ ...partsForm, item_code: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={partsForm.supplier}
                      onChange={(e) => setPartsForm({ ...partsForm, supplier: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={partsForm.description}
                    onChange={(e) => setPartsForm({ ...partsForm, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Price (R) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={partsForm.price}
                      onChange={(e) => setPartsForm({ ...partsForm, price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={partsForm.quantity}
                      onChange={(e) => setPartsForm({ ...partsForm, quantity: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock_threshold">Stock Threshold *</Label>
                    <Input
                      id="stock_threshold"
                      type="number"
                      value={partsForm.stock_threshold}
                      onChange={(e) => setPartsForm({ ...partsForm, stock_threshold: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={partsForm.location}
                    onChange={(e) => setPartsForm({ ...partsForm, location: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_stock_item"
                    checked={partsForm.is_stock_item}
                    onCheckedChange={(checked) => setPartsForm({ ...partsForm, is_stock_item: !!checked })}
                  />
                  <Label htmlFor="is_stock_item">This is a stock item</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddPart(false)
                      setEditingPart(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPart ? 'Update Part' : 'Add Part'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Non-Stock Part Modal */}
      {showAddNonStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Once-Off Part</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNonStockPart} className="space-y-4">
                <div>
                  <Label htmlFor="job_card_id">Job Card *</Label>
                  <Select 
                    value={nonStockForm.job_card_id} 
                    onValueChange={(value) => setNonStockForm({ ...nonStockForm, job_card_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job card" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobCards.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.job_number} - {job.vehicle_registration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="part_name">Part Name *</Label>
                    <Input
                      id="part_name"
                      value={nonStockForm.part_name}
                      onChange={(e) => setNonStockForm({ ...nonStockForm, part_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="part_number">Part Number</Label>
                    <Input
                      id="part_number"
                      value={nonStockForm.part_number}
                      onChange={(e) => setNonStockForm({ ...nonStockForm, part_number: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={nonStockForm.description}
                    onChange={(e) => setNonStockForm({ ...nonStockForm, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={nonStockForm.quantity}
                      onChange={(e) => setNonStockForm({ ...nonStockForm, quantity: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_cost">Unit Cost (R) *</Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      step="0.01"
                      value={nonStockForm.unit_cost}
                      onChange={(e) => setNonStockForm({ ...nonStockForm, unit_cost: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Total Cost</Label>
                    <Input
                      value={`R${(nonStockForm.quantity * nonStockForm.unit_cost).toFixed(2)}`}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={nonStockForm.supplier}
                    onChange={(e) => setNonStockForm({ ...nonStockForm, supplier: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_external_workshop"
                    checked={nonStockForm.is_external_workshop}
                    onCheckedChange={(checked) => setNonStockForm({ ...nonStockForm, is_external_workshop: !!checked })}
                  />
                  <Label htmlFor="is_external_workshop">Used by external workshop</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddNonStock(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Once-Off Part
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}