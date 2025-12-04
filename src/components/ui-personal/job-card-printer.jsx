'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  QrCode,
  Printer,
  Download,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function JobCardPrinter({
  isOpenCard,
  onCloseCard,
  jobCard, // optional preloaded object
  jobId,   // optional id to fetch from DB
}) {
  const supabase = createClient();
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (isOpenCard) {
      if (jobCard) {
        assembleAndSet(jobCard);
      } else if (jobId) {
        fetchAndAssemble(jobId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpenCard, jobCard, jobId]);

  const assembleAndSet = async (raw) => {
    setLoading(true);
    try {
      // If raw already has needed fields, use directly; otherwise try to enrich
      const assembled = await enrichJobData(raw);
      setJobData(assembled);
      generateQRCodeFor(assembled);
    } catch (err) {
      console.error('Assemble error', err);
      toast.error('Failed to prepare job card');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndAssemble = async (id) => {
    setLoading(true);
    try {
      const { data: job, error: jobError } = await supabase
        .from('workshop_job')
        .select('*')
        .eq('id', id)
        .single();

      if (jobError || !job) {
        throw jobError || new Error('Job not found');
      }
      const assembled = await enrichJobData(job);
      setJobData(assembled);
      generateQRCodeFor(assembled);
    } catch (err) {
      console.error('Fetch job error', err);
      toast.error('Failed to load job card');
    } finally {
      setLoading(false);
    }
  };

  // Enrich job row with related data: parts, workshop assign, workshop info, tech assignment, vehicle
  const enrichJobData = async (jobRow) => {
    const assembled = { ...jobRow };

    try {
      // parts
      const { data: partsRows } = await supabase
        .from('workshop_jobpart')
        .select('*')
        .eq('job_id', jobRow.id);

      assembled.parts = (partsRows || []).flatMap((r) => {
        const jp = r.job_parts ?? r.given_parts;
        if (!jp) return [];
        if (Array.isArray(jp)) {
          return jp
            .filter((p) => p != null && String(p).trim() !== '')
            .map((p) => {
              if (typeof p === 'string' || typeof p === 'number') {
                return { description: String(p), _parent_row_id: r.id };
              }
              if (typeof p === 'object') {
                return { ...p, _parent_row_id: r.id };
              }
              return { description: String(p), _parent_row_id: r.id };
            });
        }
        if (typeof jp === 'object') return [{ ...jp, _parent_row_id: r.id }];
        if (typeof jp === 'string' && jp.trim()) return [{ description: jp, _parent_row_id: r.id }];
        return [];
      });

      // workshop assignment (which workshop is assigned)
      const { data: wAssign } = await supabase
        .from('workshop_assign')
        .select('id, workshop_id, job_id')
        .eq('job_id', jobRow.id)
        .limit(1);

      if (wAssign && wAssign.length > 0) {
        const wid = wAssign[0].workshop_id;
        const { data: workshop } = await supabase
          .from('workshop')
          .select('*')
          .eq('id', wid)
          .single();
        assembled.workshop = workshop || null;
      }

      // technician assignment (workshop_assignments)
      const { data: techAssign } = await supabase
        .from('workshop_assignments')
        .select('id, tech_id, assigned_at, vehicle_id')
        .eq('job_id', jobRow.id)
        .limit(1);

      if (techAssign && techAssign.length > 0) {
        const ta = techAssign[0];
        assembled.assignment = ta;
        if (ta.tech_id) {
          const { data: tech } = await supabase
            .from('technicians_klaver')
            .select('*')
            .eq('id', ta.tech_id)
            .single();
          assembled.technician = tech || null;
        }
      } else {
        // fallback: use technician_name and technician_phone from job row if present
        assembled.technician = assembled.technician || (assembled.technician_name ? {
          name: assembled.technician_name,
          phone: assembled.technician_phone
        } : null);
      }

      // vehicle (if registration_no present)
      if (jobRow.registration_no) {
        const { data: vehicle } = await supabase
          .from('vehiclesc_workshop')
          .select('*')
          .eq('registration_number', jobRow.registration_no)
          .limit(1)
          .single();
        assembled.vehicle = vehicle || null;
      }

      return assembled;
    } catch (err) {
      console.error('enrichJobData error', err);
      return assembled;
    }
  };

  const generateQRCodeFor = (assembled) => {
    if (!assembled) return;
    const info = {
      id: assembled.id,
      jobId_workshop: assembled.jobId_workshop,
      registration_no: assembled.registration_no,
      job_type: assembled.job_type,
      description: assembled.description,
      client_name: assembled.client_name,
      client_phone: assembled.client_phone,
      location: assembled.location,
    };
    const dataString = JSON.stringify(info);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dataString)}`;
    setQrCodeUrl(url);
  };

  const handlePrint = () => {
    if (!jobData) {
      toast.error('No job data to print');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the job card');
      return;
    }

    const partsHtml = (jobData.parts || []).map((p, i) => {
      const name =
        p.part_name ||
        p.description ||
        p.part ||
        p.item_code ||
        p.name ||
        'Part';
      const qty = p.quantity ?? p.qty ?? 1;
      const price = p.price ?? p.unit_price ?? p.total_cost ?? '';
      return `<tr>
        <td style="padding:6px;border:1px solid #ddd">${i + 1}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(name)}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center">${qty}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:right">${price !== '' ? 'R' + Number(price).toFixed(2) : '-'}</td>
      </tr>`;
    }).join('');

    const workshopInfo = jobData.workshop ? `
      <div><strong>Workshop:</strong> ${escapeHtml(jobData.workshop.work_name || jobData.workshop.trading_name || '')}</div>
      <div><strong>Workshop Address:</strong> ${escapeHtml((jobData.workshop.street || '') + ' ' + (jobData.workshop.town || ''))}</div>
    ` : '';

    const technicianInfo = jobData.technician ? `
      <div><strong>Technician:</strong> ${escapeHtml(jobData.technician.name || jobData.technician_name || '')}</div>
      <div><strong>Phone:</strong> ${escapeHtml(jobData.technician.phone || jobData.technician_phone || '')}</div>
    ` : '';

    const vehicleInfo = jobData.vehicle ? `
      <div><strong>Vehicle:</strong> ${escapeHtml(jobData.vehicle.make || '')} ${escapeHtml(jobData.vehicle.model || '')}</div>
      <div><strong>Reg #:</strong> ${escapeHtml(jobData.registration_no || jobData.vehicle.registration_number || '')}</div>
    ` : `<div><strong>Reg #:</strong> ${escapeHtml(jobData.registration_no || 'N/A')}</div>`;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Job Card - ${escapeHtml(jobData.jobId_workshop || jobData.id)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding:20px; color:#111 }
            .header { display:flex; justify-content:space-between; align-items:center; }
            .meta { margin-top:6px; color:#444; font-size:13px }
            .section { margin-top:16px; }
            table { width:100%; border-collapse: collapse; margin-top:8px; }
            th, td { padding:8px; border:1px solid #e5e7eb; font-size:13px; }
            .small { font-size:13px; color:#444 }
            .center { text-align:center }
            .right { text-align:right }
            .qr { margin-top:10px; }
            .badge { display:inline-block; padding:4px 8px; background:#eef2ff; color:#3730a3; border-radius:6px; font-size:12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2 style="margin:0">${escapeHtml(jobData.jobId_workshop || ('Job #' + jobData.id))}</h2>
              <div class="meta">${escapeHtml(jobData.job_type || '')} • ${escapeHtml(jobData.status || jobData.job_status || '')}</div>
            </div>
            <div class="qr">
              ${qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR" style="width:120px;height:120px" />` : ''}
            </div>
          </div>

          <div class="section">
            <h3 style="margin:6px 0 4px 0">Job Information</h3>
            <div class="small">
              <div><strong>Driver:</strong> ${escapeHtml(jobData.driver_name || jobData.driver?.first_name + ' ' + jobData.driver?.surname || 'N/A')}</div>
              <div><strong>Description:</strong> ${escapeHtml(jobData.description || 'N/A')}</div>
            </div>
          </div>

          <div class="section">
            <h3 style="margin:6px 0 4px 0">Assignment</h3>
            <div class="small">
              ${workshopInfo}
              ${technicianInfo}
              ${vehicleInfo}
            </div>
          </div>

          <div class="section">
            <h3 style="margin:6px 0 4px 0">Parts</h3>
            <table>
              <thead>
                <tr>
                  <th style="background:#f9fafb">#</th>
                  <th style="background:#f9fafb">Description</th>
                  <th style="background:#f9fafb" class="center">Qty</th>
                  <th style="background:#f9fafb" class="right">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                ${partsHtml || '<tr><td colspan="4" style="padding:10px;text-align:center;color:#666">No parts listed</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3 style="margin:6px 0 4px 0">Costs</h3>
            <div class="small">
              <div><strong>Estimated Cost:</strong> ${jobData.estimated_cost ? 'R' + Number(jobData.estimated_cost).toFixed(2) : 'N/A'}</div>
              <div><strong>Total Cost:</strong> ${jobData.grand_total ? 'R' + Number(jobData.grand_total).toFixed(2) : 'N/A'}</div>
            </div>
          </div>

          <div class="section">
            <h3 style="margin:6px 0 4px 0">Notes</h3>
            <div style="border:1px solid #000; min-height:100px; margin:10px 0; padding:10px; background:#f9fafb;">
              ${escapeHtml(jobData.work_notes || jobData.notes || '')}
            </div>
            <div>
              <h2>Additional Notes</h2>
            <div style="border:1px solid #000; height:60px; margin:10px 0; background:#fff;"></div>
          </div>

          <div class="section">
            <h3 style="margin:6px 0 4px 0">Technician Signature</h3>
            <div style="border:1px solid #000; height:60px; margin:10px 0; background:#fff;"></div>
            <div class="small" style="margin-top:8px;">
              <div><strong>Technician Name:</strong> ${escapeHtml(jobData.technician?.name || jobData.technician_name || '')}</div>
              <div><strong>Date:</strong> _______________</div>
              <div><strong>Time:</strong> _______________</div>
            </div>
          </div>

          <div class="section">
            <h3 style="margin:6px 0 4px 0">Manager Signature</h3>
            <div style="border:1px solid #000; height:60px; margin:10px 0; background:#fff;"></div>
            <div class="small" style="margin-top:8px;">
              <div><strong>Manager Name:</strong> _______________</div>
              <div><strong>Date:</strong> _______________</div>
              <div><strong>Time:</strong> _______________</div>
            </div>
          </div>

          <div class="section">
            <h3 style="margin:6px 0 4px 0">Administrator Signature</h3>
            <div style="border:1px solid #000; height:60px; margin:10px 0; background:#fff;"></div>
            <div class="small" style="margin-top:8px;">
              <div><strong>Administrator Name:</strong> _______________</div>
              <div><strong>Date:</strong> _______________</div>
              <div><strong>Time:</strong> _______________</div>
            </div>
          </div>

          <div style="margin-top:18px; font-size:12px; color:#666">
            Generated: ${new Date().toLocaleString()} by Skyfleet Workshop Management System
            <br />
            <p style="font-size:1px; color:#666">M.M Soltrack</p>
          </div>
                    <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 6px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Contact Information:</strong><br>
              Maintenance Workshop<br>
              Name: Lwazi
              Email: stores@klaverplant.co.za<br>
              Phone: +27 11 123 4567
            </p>
          </div>

          <div style="margin-top:18px; font-size:12px; color:#666">
            <p style="font-size:1px; color:#666">M.M Soltrack</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 800);
  };

  const handleDownload = () => {
    if (!qrCodeUrl) {
      toast.error('QR code not available');
      return;
    }
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `job-qr-${jobData?.jobId_workshop || jobData?.id || 'job'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded successfully');
  };

  // small helper to escape HTML when generating print content
  const escapeHtml = (unsafe) => {
    if (unsafe == null) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  if (!isOpenCard) return null;

  return (
    <Dialog open={isOpenCard} onOpenChange={onCloseCard}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Job Card Print{jobData ? `: ${jobData.jobId_workshop || jobData.id}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {loading ? (
                <div>Loading job data...</div>
              ) : jobData ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{jobData.jobId_workshop || `Job #${jobData.id}`}</h3>
                      <div className="text-sm text-muted-foreground">{jobData.job_type} • {jobData.status || jobData.job_status}</div>
                    </div>
                    {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-24 h-24 border" />}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Driver</div>
                      <div>{jobData.client_name || 'N/A'}</div>
                      <div>{jobData.client_phone || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="font-medium">Vehicle</div>
                      <div>{jobData.registration_no || (jobData.vehicle && jobData.vehicle.registration_number) || 'N/A'}</div>
                      <div>{jobData.vehicle ? `${jobData.vehicle.make || ''} ${jobData.vehicle.model || ''}` : ''}</div>
                    </div>
                  </div>

                  <div className="pt-2 text-sm">
                    <div className="font-medium">Description</div>
                    <div>{jobData.description || 'N/A'}</div>
                  </div>

                  <div className="pt-2 text-sm">
                    <div className="font-medium">Technician</div>
                    <div>{jobData.technician?.name || jobData.technician_name || 'Unassigned'}</div>
                    <div className="text-xs text-muted-foreground">{jobData.technician?.phone || jobData.technician_phone || ''}</div>
                  </div>
                </div>
              ) : (
                <div>No job data available</div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-center">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="mr-2 w-4 h-4" /> Print Job Card
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 w-4 h-4" /> Download QR
            </Button>
            <Button onClick={onCloseCard} variant="ghost">
              <X className="mr-2 w-4 h-4" /> Close
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">This will print a ready-to-use job card with linked parts, technician and workshop info (if available).</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
