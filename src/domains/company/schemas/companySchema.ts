import { z } from 'zod';
import { requiredString, optionalString, emailSchema } from '@shared/forms/schemas/common';

export const companyStatusEnum = z.enum(['active', 'passive']);

/** Tehlike Sınıfı options for form */
export const dangerClassEnum = z.enum(['Az Tehlikeli', 'Tehlikeli', 'Çok Tehlikeli']);

export const companyFormSchema = z.object({
  name: requiredString(2),
  naceCode: z.string().optional().default(''),
  dangerClass: dangerClassEnum.optional(),
  sector: optionalString.default(''),
  sgkSicilNo: requiredString(1),
  taxOffice: optionalString.default(''),
  taxNumber: optionalString.default(''),
  city: optionalString.default(''),
  district: optionalString.default(''),
  address: optionalString.default(''),
  phone: optionalString.default(''),
  email: z.union([z.literal(''), emailSchema]).default(''),
  status: companyStatusEnum,
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;
