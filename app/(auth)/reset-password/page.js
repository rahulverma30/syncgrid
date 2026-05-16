'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: formData.get('token'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
      }),
    });
    const data = await response.json().catch(() => ({}));

    setIsLoading(false);

    if (!response.ok) {
      setError(data.message || 'Unable to reset password.');
      toast.error('Password reset failed', {
        description: data.message || 'Unable to reset password.',
      });
      return;
    }

    toast.success('Password reset successfully!');
    setMessage('Password reset successfully. You can sign in now.');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose new password</CardTitle>
        <CardDescription>Use the reset token from your email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            name="token"
            label="Reset token"
            type="text"
            defaultValue={searchParams.get('token') || ''}
            required
          />
          <Input
            name="password"
            label="New password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            required
            icon={showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            iconPosition="right"
            iconButton
            iconButtonAriaLabel={showPassword ? 'Hide password' : 'Show password'}
            onIconClick={() => setShowPassword((visible) => !visible)}
          />
          <Input
            name="confirmPassword"
            label="Confirm new password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            required
            icon={
              showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
            }
            iconPosition="right"
            iconButton
            iconButtonAriaLabel={
              showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
            }
            onIconClick={() => setShowConfirmPassword((visible) => !visible)}
          />
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Reset password
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
