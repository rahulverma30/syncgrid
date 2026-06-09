'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2, User, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthError, getClientError, SUCCESS_MESSAGES } from '@/lib/errors';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Input, Button } from '@/components/ui';

interface InviteData {
  email: string;
  companyName: string;
  companyId: string;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;
  const router = useRouter();

  const [verifying, setVerifying] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Verify token validity on load
  useEffect(() => {
    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/invite/verify?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (data.success) {
          setInviteData(data.data);
        } else {
          const err = getAuthError(data.error || data.message);
          setErrorMsg(err.description);
        }
      } catch (err) {
        setErrorMsg(
          "We couldn't verify your invitation. Please check your connection and try reloading."
        );
      } finally {
        setVerifying(false);
      }
    }

    if (token) {
      verifyToken();
    }
  }, [token]);

  // 2. Submit form and perform auto-login
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords Do Not Match', {
        description: 'The passwords you entered do not match. Please re-enter them carefully.',
      });
      return;
    }

    if (password.length < 8) {
      toast.error('Password Too Short', {
        description: 'Your password must be at least 8 characters long.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/invite/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          password,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(SUCCESS_MESSAGES.inviteAccepted.title, {
          description: SUCCESS_MESSAGES.inviteAccepted.description,
        });

        // Auto-login after creation
        const loginResult = await signIn('credentials', {
          email: inviteData?.email || '',
          password: password,
          redirect: false,
        });

        setIsSubmitting(false);

        if (loginResult?.error) {
          toast.info('Account Ready', {
            description: 'Your account is set up. Please sign in with your new password.',
          });
          router.push('/login');
        } else {
          toast.success('Welcome aboard! 🎉');
          router.push('/dashboard');
          router.refresh();
        }
      } else {
        const err = getClientError(data);
        toast.error(err.title, { description: err.description });
        setIsSubmitting(false);
      }
    } catch (err) {
      toast.error('Something Went Wrong', {
        description: "We couldn't complete your registration. Please try again.",
      });
      setIsSubmitting(false);
    }
  }

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 italic text-sm">Verifying invitation credentials...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ShieldAlert className="w-12 h-12 text-destructive animate-pulse" />
          </div>
          <CardTitle className="text-destructive">Invitation Invalid</CardTitle>
          <CardDescription>{errorMsg}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => router.push('/login')} variant="outline" className="px-6 py-2.5">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            Invitation Valid
          </span>
        </div>
        <CardTitle>Welcome to {inviteData?.companyName}</CardTitle>
        <CardDescription>
          Complete your credentials below to active your corporate account as{' '}
          <strong className="text-foreground">{inviteData?.email}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="name"
            label="Full Corporate Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
          />

          <Input
            name="password"
            label="Choose Password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            icon={showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            iconPosition="right"
            iconButton
            iconButtonAriaLabel={showPassword ? 'Hide password' : 'Show password'}
            onIconClick={() => setShowPassword((visible) => !visible)}
          />

          <Input
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
          />

          <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
            Accept & Launch Dashboard
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
