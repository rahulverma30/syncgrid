'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
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

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const errorMsg = data.message || 'Unable to create account.';
      setError(errorMsg);
      toast.error('Registration failed', { description: errorMsg });
      setIsLoading(false);
      return;
    }

    toast.success('Account created!');

    await signIn('credentials', {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    toast.success('Signed in successfully!');
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
          <Input
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            required
            icon={showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            iconPosition="right"
            iconButton
            iconButtonAriaLabel={showPassword ? 'Hide password' : 'Show password'}
            onIconClick={() => setShowPassword((visible) => !visible)}
          />
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
