'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Input, Button } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      const raw = result.error;
      const decoded = decodeURIComponent(raw || 'Invalid email or password.');
      const errorMsg = decoded || 'Invalid email or password.';
      setError(errorMsg);
      toast.error('Sign in failed', { description: errorMsg });
      return;
    }

    toast.success('Signed in successfully!');
    router.push(searchParams.get('callbackUrl') || '/dashboard');
    router.refresh();
  }

  useEffect(() => {
    if (errorParam) {
      const decoded = decodeURIComponent(errorParam);
      toast.error('Sign in failed', { description: decoded });
      // Schedule state update to avoid synchronous cascading render and satisfy ESLint
      setTimeout(() => setError(decoded), 0);
    }
  }, [errorParam]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input name="email" label="Email" type="email" placeholder="you@example.com" required />
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
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>
        <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
