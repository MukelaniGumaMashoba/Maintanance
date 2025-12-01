"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Printer, Car, User, Calendar, Package } from "lucide-react";
import JobCardPrinter from "./job-card-printer";
import { useState } from "react";

export default function JobCardViewModal({
  isOpen,
  onClose,
  jobCard,
  onRemovePart
}) {
  if (!jobCard) return null;


  const [isOpenCard, setIsOpenCard] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCloseCard = () => {
    setIsOpenCard(false);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              Job Card Details - {jobCard.job_number}
            </DialogTitle>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setIsOpenCard(true)}
            >
              <Printer className="mr-1 w-3 h-3" />
              Print
            </Button>
            {jobCard.status?.toLowerCase() === 'completed' && (
              <Badge variant="secondary" className="ml-2">View Only</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 print:space-y-4">
          {/* Job Information */}
          <Card className="print:shadow-none print:border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="w-5 h-5" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Job Number</p>
                <p className="font-semibold">{jobCard.job_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant="outline">{jobCard.status || jobCard.job_status}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold">{jobCard.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vehicle Registration</p>
                <p className="font-semibold">{jobCard.vehicle_registration || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-semibold">{jobCard.job_description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-semibold">
                  {jobCard.due_date ? new Date(jobCard.due_date).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-semibold">
                  {new Date(jobCard.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Parts */}
          <Card className="print:shadow-none print:border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5" />
                Assigned Parts ({jobCard.parts_required?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!jobCard.parts_required || jobCard.parts_required.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No parts assigned to this job</p>
              ) : (
                <div className="space-y-3">
                  {jobCard.parts_required.map((part, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg print:bg-white print:border">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{part.description || part.part_name}</p>
                            {part.item_code && (
                              <p className="text-sm text-gray-500">Code: {part.item_code}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="ml-auto">
                            Qty: {part.quantity || 1}
                          </Badge>
                          {part.price && (
                            <Badge variant="outline">
                              R{(part.price * (part.quantity || 1)).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {jobCard.status?.toLowerCase() !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemovePart(jobCard, part)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 print:hidden"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Parts Cost:</span>
                      <span className="font-bold text-lg">
                        R{(jobCard.parts_required.reduce((sum, part) =>
                          sum + ((part.price || 0) * (part.quantity || 1)), 0
                        )).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Print Footer */}
          <div className="hidden print:block text-center text-sm text-gray-500 mt-8">
            <p>Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </DialogContent>
      
      <JobCardPrinter
        isOpenCard={isOpenCard}
        onCloseCard={handleCloseCard}
        jobCard={jobCard}
        jobId={jobCard.id}
      />
    </Dialog>
  );
}