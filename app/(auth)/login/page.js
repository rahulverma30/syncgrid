import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Input, Button } from '@/components/ui';

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your account to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input label="Email" type="email" placeholder="you@example.com" />
        <Input label="Password" type="password" placeholder="Password" />
        <Button className="w-full">Sign in</Button>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
