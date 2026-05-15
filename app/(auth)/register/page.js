'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get('name'),
      companyName: formData.get('companyName'),
      email: formData.get('email'),
      password: formData.get('password'),
    };

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || 'Unable to create account.');
      setIsLoading(false);
      return;
    }

    await signIn('credentials', {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create workspace</CardTitle>
        <CardDescription>Set up the account shell for your organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input name="name" label="Name" type="text" placeholder="Rahul Sharma" required />
          <Input
            name="companyName"
            label="Company"
            type="text"
            placeholder="Acme Studio"
            required
          />
          <Input
            name="email"
            label="Work email"
            type="email"
            placeholder="you@company.com"
            required
          />
          <Input name="password" label="Password" type="password" placeholder="Password" required />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
