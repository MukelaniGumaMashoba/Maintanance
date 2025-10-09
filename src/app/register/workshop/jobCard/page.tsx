"use client";

import React from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";

export default function JobCardForm() {
    const supabase = createClient();

    // Initialize selectedJob with empty/default values
    const [selectedJob, setSelectedJob] = React.useState({
        id: "",
        date: "",
        client: "",
        contact: "",
        time: "",
        location: "",
        job_type: "",
        vehicle_make: "",
        horse_fleet_no: "",
        horse_reg_no: "",
        odo_reading: "",
        mechanic: "",
        trailer_fleet_no: "",
        trailer_reg_no: "",
        technician: "",
        description: "",
        status: "",
        emergency_type: "",
    });

    const [notes, setNotes] = React.useState("");

    const saveJobCard = async () => {
        if (!selectedJob.id) {
            alert("Job ID is required.");
            return;
        }

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                alert("User not authenticated.");
                return;
            }

            const jobCardPayload = {
                job_assignment_id: selectedJob.id,
                updated_by: user.id,
                date: selectedJob.date || null,
                client_name: selectedJob.client || null,
                contact: selectedJob.contact || null,
                time: selectedJob.time || null,
                location: selectedJob.location || null,
                job_type: selectedJob.job_type || null,
                vehicle_make: selectedJob.vehicle_make || null,
                horse_fleet_no: selectedJob.horse_fleet_no || null,
                horse_reg_no: selectedJob.horse_reg_no || null,
                odo_reading: selectedJob.odo_reading
                    ? parseInt(selectedJob.odo_reading)
                    : null,
                mechanic: selectedJob.mechanic || null,
                trailer_fleet_no: selectedJob.trailer_fleet_no || null,
                trailer_reg_no: selectedJob.trailer_reg_no || null,
                technician: selectedJob.technician || null,
                description: selectedJob.description || null,
                notes: notes || null,
                updated_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from("job_card")
                .insert(jobCardPayload as unknown as [])
                
            if (error) throw error;
            alert("Job card saved successfully!");
        } catch (error: any) {
            alert("Error saving job card: " + error.message || error);
        }
    };

    // Destructure for convenience
    const {
        id,
        date,
        client,
        contact,
        time,
        location,
        job_type,
        vehicle_make,
        horse_fleet_no,
        horse_reg_no,
        odo_reading,
        mechanic,
        trailer_fleet_no,
        trailer_reg_no,
        technician,
        description,
    } = selectedJob;

    return (
        <div className="flex-1 bg-gray-100 min-h-screen p-4 flex justify-center items-start">

            <div className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-lg mt-6">
                <div className="flex justify-items-start space-x-4 mt-4">
                    <Button onClick={() => {
                        redirect('/')
                    }} className="bg-red-700 hover:bg-red-800">
                        <span className="font-bold text-white">Back</span>
                    </Button>
                </div>
                <h2 className="text-2xl font-bold text-blue-900 mb-4">Record Job Card</h2>
                <div className="mb-4">
                    <label className="block text-gray-600 mb-1">Job ID *</label>
                    <Input
                        placeholder="Job ID"
                        value={id}
                        onChange={(e) =>
                            setSelectedJob({ ...selectedJob, id: e.target.value })
                        }
                        className="bg-gray-100 text-gray-900"
                    />
                </div>

                {/* Rest of the fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-600 mb-1">Date</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, date: e.target.value })
                                }
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Client</label>
                            <Input
                                value={client}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, client: e.target.value })
                                }
                                placeholder="Client Name"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Contact</label>
                            <Input
                                value={contact}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, contact: e.target.value })
                                }
                                placeholder="Contact"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Time</label>
                            <Input
                                value={time}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, time: e.target.value })
                                }
                                placeholder="HH:MM"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Location</label>
                            <Input
                                value={location}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, location: e.target.value })
                                }
                                placeholder="Location"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Job Type</label>
                            <Input
                                value={job_type}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, job_type: e.target.value })
                                }
                                placeholder="Job Type"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-600 mb-1">Vehicle Make</label>
                            <Input
                                value={vehicle_make}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, vehicle_make: e.target.value })
                                }
                                placeholder="Vehicle Make"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Horse Fleet no</label>
                            <Input
                                value={horse_fleet_no}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, horse_fleet_no: e.target.value })
                                }
                                placeholder="Horse Fleet no"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Horse Reg no</label>
                            <Input
                                value={horse_reg_no}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, horse_reg_no: e.target.value })
                                }
                                placeholder="Horse Reg no"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">ODO Reading</label>
                            <Input
                                value={odo_reading}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, odo_reading: e.target.value })
                                }
                                placeholder="ODO Reading"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Mechanic</label>
                            <Input
                                value={mechanic}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, mechanic: e.target.value })
                                }
                                placeholder="Mechanic"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Trailer Fleet no</label>
                            <Input
                                value={trailer_fleet_no}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, trailer_fleet_no: e.target.value })
                                }
                                placeholder="Trailer Fleet no"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Trailer Reg no</label>
                            <Input
                                value={trailer_reg_no}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, trailer_reg_no: e.target.value })
                                }
                                placeholder="Trailer Reg no"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">Technician</label>
                            <Input
                                value={technician}
                                onChange={(e) =>
                                    setSelectedJob({ ...selectedJob, technician: e.target.value })
                                }
                                placeholder="Technician"
                                className="bg-gray-100 text-gray-900"
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-blue-900 font-semibold mb-2">
                        Client Instructions & Requirements
                    </p>
                    <Input
                        type="textarea"
                        value={description}
                        onChange={(e) =>
                            setSelectedJob({ ...selectedJob, description: e.target.value })
                        }
                        placeholder="Client instructions and requirements"
                        className="bg-gray-100 text-gray-900 rounded-lg p-3 min-h-[60px]"
                    />
                </div>

                <div className="mb-6">
                    <p className="text-blue-900 font-semibold mb-2">Additional Notes</p>
                    <Input
                        type="textarea"
                        placeholder="Add notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="bg-gray-100 text-gray-900 rounded-lg p-3 min-h-[60px]"
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <Button onClick={saveJobCard} className="bg-blue-700 hover:bg-blue-800">
                        <span className="font-bold text-white">Save</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
