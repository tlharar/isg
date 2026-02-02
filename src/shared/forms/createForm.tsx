import { useForm, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Typed form factory using React Hook Form + Zod.
 * Use for OHS forms to keep validation consistent and avoid unnecessary re-renders.
 */
export function createForm<T extends z.ZodType>(schema: T) {
  type Values = z.infer<T>;

  return function useTypedForm(
    props?: Omit<UseFormProps<Values>, 'resolver'>
  ) {
    return useForm<Values>({
      resolver: zodResolver(schema),
      mode: 'onTouched',
      ...props,
    });
  };
}
