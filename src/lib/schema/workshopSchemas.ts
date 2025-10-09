// schemas/workshopSchemas.ts
import { z } from "zod";

export const workshopInfoSchema = z.object({
  work_name: z.string().min(1, "Workshop name is required"),
  trading_name: z.string().optional(),
  number_of_working_days: z.number().int().positive().optional(),
  labour_rate: z.number().positive().optional(),
  fleet_rate: z.number().positive().optional(),
  vehicles_type: z.array(z.string()).optional(),
  workshop_type: z.array(z.string()).optional(),
});

export const insuranceBankingSchema = z.object({
  insurance_policy_number: z.number().optional(),
  insurance_company_name: z.string().optional(),
  bank_name: z.string().optional(),
  account_no: z.number().optional(),
  // bank_letter: z.string().optional(),
  bank_letter: z
    .any()
    .optional()
    .refine((files) => !files || files.length <= 1, "Only one file is allowed"),
});

export const contactLocationSchema = z.object({
  after_hours_number: z.string().optional(),
  province: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  town: z.string().optional(),
  postal_code: z.number().optional(),
});

export const fleetManagerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(8, "Phone number is required"),
  role: z.string().default("fleet manager"),
});
export type WorkshopInfo = z.infer<typeof workshopInfoSchema>;
export type InsuranceBanking = z.infer<typeof insuranceBankingSchema>;
export type ContactLocation = z.infer<typeof contactLocationSchema>;
export type FleetManager = z.infer<typeof fleetManagerSchema>;
