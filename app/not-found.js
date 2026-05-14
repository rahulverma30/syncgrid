import Link from 'next/link';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>
            This route is not part of the current foundation module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
