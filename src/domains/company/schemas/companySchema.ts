import { z } from 'zod';
import { requiredString } from '@shared/forms/schemas/common';

export const companyStatusEnum = z.enum(['active', 'passive']);

export const companyFormSchema = z.object({
  name: requiredString(2),
  taxNo: requiredString(1),
  address: requiredString(2),
  sgkNo: requiredString(1),
  city: requiredString(1),
  district: requiredString(1),
  status: companyStatusEnum,
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;
