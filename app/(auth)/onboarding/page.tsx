'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Building,
  Users,
  Compass,
  FileText,
  Palette,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  // Step 1: Branding & Profile
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [accentColor, setAccentColor] = useState('#3B82F6'); // Default Blue

  // Step 2: Pricing Tiers
  const [planSlug, setPlanSlug] = useState<'starter' | 'pro' | 'enterprise'>('pro');

  // Step 3: Team Calibration
  const [teamSize, setTeamSize] = useState(5);
  const [inviteEmails, setInviteEmails] = useState('');

  // Step 4: Template Selector
  const [template, setTemplate] = useState<'agile' | 'wiki' | 'none'>('agile');

  const handleNext = () => {
    if (step === 1 && (!name || !slug)) {
      toast.error('Please input your organization name and subdomain slug.');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setLoadingStatus('Initializing MongoDB multi-tenant schema maps...');

    setTimeout(() => setLoadingStatus('Configuring enterprise active subscription tiers...'), 1000);
    setTimeout(() => setLoadingStatus('Provisioning new Workspace & scoping roles...'), 2000);
    setTimeout(() => setLoadingStatus('Seeding Agile boards & compliance Wiki pages...'), 3000);
    setTimeout(() => setLoadingStatus('Redirecting to your new live SaaS dashboard...'), 4000);

    try {
      const invites = inviteEmails
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0 && e.includes('@'));

      const res = await fetch('/api/saas/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          planSlug,
          template,
          teamSize,
          initialInvites: invites,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Enterprise Workspace provisioned successfully!');
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Onboarding failed.');
        setLoading(false);
      }
    } catch (err) {
      toast.error('Network error during workspace onboarding.');
      setLoading(false);
    }
  };

  const colors = [
    { name: 'Neon Blue', hex: '#3B82F6' },
    { name: 'Cyan Highlight', hex: '#06B6D4' },
    { name: 'Emerald Mint', hex: '#10B981' },
    { name: 'Sleek Violet', hex: '#8B5CF6' },
    { name: 'Hot Amber', hex: '#F59E0B' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6 text-center px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="text-blue-500"
        >
          <Loader2 className="w-12 h-12" />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Workspace Onboarding Provisioning
          </h2>
          <p className="text-sm text-slate-400 italic max-w-md animate-pulse">{loadingStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-2xl bg-slate-900/40 border border-slate-850 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Progress Tracker bar */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Step {step} of 4 • Onboarding Setup
          </span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-all duration-350 ${
                  i <= step ? 'bg-blue-600' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left relative z-10"
            >
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-white flex items-center space-x-2">
                  <Building className="w-6 h-6 text-blue-500" />
                  <span>Branding & Subdomain</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Establish your enterprise workspace profile and default accent variable.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Organization / Company Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '-')
                          .substring(0, 20)
                      );
                    }}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Workspace Subdomain Slug
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-800 focus-within:border-blue-500/50 transition-colors">
                    <span className="bg-slate-950 px-4 py-3 text-sm text-slate-500 border-r border-slate-850">
                      https://
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) =>
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      }
                      placeholder="acme"
                      className="w-full bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                    />
                    <span className="bg-slate-950 px-4 py-3 text-sm text-slate-500 border-l border-slate-850">
                      .syncgrid.com
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Brand Accent Variable
                  </label>
                  <div className="flex gap-3">
                    {colors.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setAccentColor(c.hex)}
                        style={{ backgroundColor: c.hex }}
                        className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                          accentColor === c.hex
                            ? 'ring-4 ring-blue-500/30 border-2 border-white'
                            : ''
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left relative z-10"
            >
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-white flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                  <span>Choose Plan Tier</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Select your commercial pricing tier. Subscriptions begin with an initial 14-day
                  trial period.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Starter Plan */}
                <div
                  onClick={() => setPlanSlug('starter')}
                  className={`bg-slate-950 p-5 rounded-2xl border cursor-pointer text-left transition-all ${
                    planSlug === 'starter'
                      ? 'border-blue-500/50 bg-blue-500/5 shadow-lg'
                      : 'border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Starter
                  </span>
                  <div className="flex items-baseline space-x-1 mt-2">
                    <span className="text-xl font-bold text-white">$19</span>
                    <span className="text-[10px] text-slate-500">/mo</span>
                  </div>
                  <ul className="space-y-1.5 mt-4 text-[10px] text-slate-400 font-medium">
                    <li>• Up to 10 active seats</li>
                    <li>• 15GB Cloud Storage</li>
                    <li>• 5,000 API requests</li>
                  </ul>
                </div>

                {/* Pro Plan */}
                <div
                  onClick={() => setPlanSlug('pro')}
                  className={`bg-slate-950 p-5 rounded-2xl border cursor-pointer text-left transition-all relative ${
                    planSlug === 'pro'
                      ? 'border-blue-500/50 bg-blue-500/5 shadow-lg'
                      : 'border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <span className="absolute -top-2.5 right-4 text-[8px] uppercase font-bold tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Pro Plan
                  </span>
                  <div className="flex items-baseline space-x-1 mt-2">
                    <span className="text-xl font-bold text-white">$49</span>
                    <span className="text-[10px] text-slate-500">/mo</span>
                  </div>
                  <ul className="space-y-1.5 mt-4 text-[10px] text-slate-400 font-medium">
                    <li>• Up to 50 active seats</li>
                    <li>• 100GB Cloud Storage</li>
                    <li>• 50,000 API requests</li>
                    <li>• Custom branding</li>
                  </ul>
                </div>

                {/* Enterprise Plan */}
                <div
                  onClick={() => setPlanSlug('enterprise')}
                  className={`bg-slate-950 p-5 rounded-2xl border cursor-pointer text-left transition-all ${
                    planSlug === 'enterprise'
                      ? 'border-blue-500/50 bg-blue-500/5 shadow-lg'
                      : 'border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Enterprise
                  </span>
                  <div className="flex items-baseline space-x-1 mt-2">
                    <span className="text-xl font-bold text-white">$499</span>
                    <span className="text-[10px] text-slate-500">/mo</span>
                  </div>
                  <ul className="space-y-1.5 mt-4 text-[10px] text-slate-400 font-medium">
                    <li>• Unlimited users</li>
                    <li>• 1TB Cloud Storage</li>
                    <li>• 500,000 API requests</li>
                    <li>• SSO & custom SLA</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left relative z-10"
            >
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-white flex items-center space-x-2">
                  <Users className="w-6 h-6 text-blue-500" />
                  <span>Team Setup</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Calibrate your organization workspace size and invite mock collaborators.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="font-bold uppercase tracking-wider">
                      Estimated User Seats Allocation
                    </span>
                    <span className="font-bold text-blue-500 text-sm">{teamSize} seats</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={teamSize}
                    onChange={(e) => setTeamSize(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 rounded-full bg-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Invite Collaborators (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="Enter email addresses separated by commas (e.g. dev@acme.com, qa@acme.com)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-colors resize-none"
                  />
                  <span className="text-[9px] text-slate-500 block">
                    *Invited emails will immediately populate mock user accounts for system testing.
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left relative z-10"
            >
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black text-white flex items-center space-x-2">
                  <Compass className="w-6 h-6 text-blue-500" />
                  <span>Choose Workspace Template</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Select a starter workspace context. We will populate a high-fidelity mock template
                  for immediate evaluation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Agile Software */}
                <div
                  onClick={() => setTemplate('agile')}
                  className={`bg-slate-950 p-5 rounded-2xl border cursor-pointer text-left transition-all ${
                    template === 'agile'
                      ? 'border-blue-500/50 bg-blue-500/5 shadow-lg'
                      : 'border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="p-2 bg-blue-600/10 text-blue-500 rounded-xl w-max mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Agile Launch Board</h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Includes pre-seeded task backlogs, active milestone schedules, developers
                    allocations, and risk cards.
                  </p>
                </div>

                {/* Corporate Knowledge Base */}
                <div
                  onClick={() => setTemplate('wiki')}
                  className={`bg-slate-950 p-5 rounded-2xl border cursor-pointer text-left transition-all ${
                    template === 'wiki'
                      ? 'border-blue-500/50 bg-blue-500/5 shadow-lg'
                      : 'border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="p-2 bg-emerald-600/10 text-emerald-500 rounded-xl w-max mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Compliance Wiki Library</h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Seeds custom corporate manuals, brand white-labels documentation, and standard
                    workflow operating guides.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls footer */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-850/60 relative z-10">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-slate-800 hover:bg-slate-850 text-slate-300 rounded-xl py-5 px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 px-6 font-semibold"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-5 px-8 font-bold shadow-lg shadow-blue-500/10"
            >
              Complete Onboarding
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
