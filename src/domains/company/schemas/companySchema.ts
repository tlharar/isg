import { z } from 'zod';
import { requiredString } from '@shared/forms/schemas/common';

export const companyFormSchema = z.object({
  name: requiredString(2),
  taxNo: requiredString(1),
  address: requiredString(2),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;
