/**
 * Example form component
 * Demonstrates form handling with validation
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '@/schemas/example';
import { Input, Textarea, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { toast } from 'sonner';

export function ExampleContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('Form data:', data);
      toast.success('Contact saved successfully!');
      reset();
    } catch (error) {
      toast.error('Failed to save contact');
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Add New Contact</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              {...register('firstName')}
              error={errors.firstName?.message as string}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              {...register('lastName')}
              error={errors.lastName?.message as string}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            {...register('email')}
            error={errors.email?.message as string}
          />

          <Input
            label="Company"
            placeholder="Acme Inc"
            {...register('company')}
            error={errors.company?.message as string}
          />

          <Textarea
            label="Notes"
            placeholder="Additional notes..."
            {...register('notes')}
            error={errors.notes?.message as string}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Save Contact
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
