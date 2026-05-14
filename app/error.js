'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            {error?.message || 'The application hit an unexpected error.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
