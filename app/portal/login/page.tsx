'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, Loader2, ArrowRight, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function PortalLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Two-step MFA challenge states
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Authentication failed');
      }

      if (result.mfaRequired) {
        // Multi-Factor Intercept: proceed to challenge step
        setTempToken(result.tempToken);
        setMfaRequired(true);
        toast.info('Two-Factor authentication is required to verify your identity.');
      } else {
        toast.success('Welcome to your Client Space!');
        router.push('/portal');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) {
      toast.error('Verification code must be exactly 6 digits.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/portal/auth/mfa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: mfaCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Verification challenge failed.');
      }

      toast.success('MFA Identity certified. Welcome to your Client Space!');
      router.push('/portal');
    } catch (error: any) {
      toast.error(error.message || 'Incorrect verification token code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black p-4 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Accent top stripe */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-emerald-500" />

          {!mfaRequired ? (
            // Form Step 1: Standard Credentials
            <>
              <CardHeader className="pt-8 pb-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                  SyncGrid Client Portal
                </h1>
                <p className="text-sm text-slate-400">
                  Enter your credentials to securely access your workspace
                </p>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block text-left">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <Input
                        {...register('email')}
                        type="email"
                        placeholder="name@company.com"
                        className="pl-10 bg-slate-950/40 border-slate-800 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-rose-500 text-left">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block text-left">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <Input
                        {...register('password')}
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-slate-950/40 border-slate-800 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-xs text-rose-500 text-left">{errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white border-0 shadow-lg shadow-blue-600/10 py-6 rounded-xl font-bold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            // Form Step 2: Multi-Factor OTP Code challenge
            <>
              <CardHeader className="pt-8 pb-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20 mb-4">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                  Enter Verification Code
                </h1>
                <p className="text-sm text-slate-400">
                  Open your authenticator app (Google/Microsoft Authenticator) and enter the 6-digit
                  dynamic token.
                </p>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <form onSubmit={handleMfaSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block text-left">
                      Dynamic TOTP Passcode
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      className="bg-slate-950/40 border-slate-800 text-white text-center text-lg font-bold tracking-[0.25em] placeholder-slate-700 py-6 rounded-xl"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white border-0 shadow-lg shadow-rose-600/10 py-6 rounded-xl font-bold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying Code...
                      </>
                    ) : (
                      <>
                        Verify & Login
                        <Shield className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          <CardFooter className="bg-slate-950/30 border-t border-slate-850 p-6 flex flex-col space-y-2 text-center">
            <span className="text-xs text-slate-500">
              Need access? Contact your project manager or agency representative.
            </span>
            <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-600">
              <span>Secure Gateway</span>
              <span>•</span>
              <span>256-bit Encryption</span>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
