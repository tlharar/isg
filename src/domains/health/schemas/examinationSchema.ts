import { z } from 'zod';
import { optionalString } from '@shared/forms/schemas/common';

/** Normal / Anormal for physical exam checkboxes */
export const physicalFindingEnum = z.enum(['Normal', 'Anormal']);

/** Conclusion: Çalışabilir / Şartlı Çalışabilir / Çalışamaz */
export const conclusionEnum = z.enum(['Çalışabilir', 'Şartlı Çalışabilir', 'Çalışamaz']);

/** Tehlikeli İşlerde Çalışabilir mi? */
export const dangerousWorkEligibleEnum = z.enum(['Evet', 'Hayır']);

export const examinationFormSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  // Tab 1: Anamnez
  smokingAlcohol: optionalString.default(''),
  chronicDiseases: optionalString.default(''),
  pastSurgeries: optionalString.default(''),
  // Tab 2: Fizik Muayene
  heightCm: z.coerce.number().min(0).optional(),
  weightKg: z.coerce.number().min(0).optional(),
  systolicBp: z.coerce.number().min(0).optional(),
  diastolicBp: z.coerce.number().min(0).optional(),
  pulse: z.coerce.number().min(0).optional(),
  vision: physicalFindingEnum.optional(),
  hearing: physicalFindingEnum.optional(),
  respiratory: physicalFindingEnum.optional(),
  musculoskeletal: physicalFindingEnum.optional(),
  // Tab 3: Laboratuvar
  chestXRay: optionalString.default(''),
  audiometry: optionalString.default(''),
  bloodValues: optionalString.default(''),
  // Tab 4: Kanaat ve Sonuç
  conclusion: conclusionEnum.optional(),
  dangerousWorkEligible: dangerousWorkEligibleEnum.optional(),
  reportDate: z.coerce.date().optional(),
  nextExaminationDate: z.coerce.date().optional(),
});

export type ExaminationFormValues = z.infer<typeof examinationFormSchema>;
