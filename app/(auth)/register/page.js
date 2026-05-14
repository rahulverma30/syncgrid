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

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create workspace</CardTitle>
        <CardDescription>Set up the account shell for your organization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input label="Name" type="text" placeholder="Rahul Sharma" />
        <Input label="Work email" type="email" placeholder="you@company.com" />
        <Input label="Password" type="password" placeholder="Password" />
        <Button className="w-full">Create account</Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
