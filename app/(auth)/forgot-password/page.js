'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.get('email'),
      }),
    });
    const data = await response.json().catch(() => ({}));

    setMessage(data.message || 'If the account exists, password reset instructions will be sent.');
    setDevToken(data.devResetToken || '');
    setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your email to receive reset instructions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input name="email" label="Email" type="email" placeholder="you@example.com" required />
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          {devToken && (
            <p className="break-all rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">
              Development reset token: {devToken}
            </p>
          )}
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send reset link
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
