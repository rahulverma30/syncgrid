import Link from "next/link";
import { Button } from "@/components/ui";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex flex-col items-center justify-center gap-12 p-4">
      {/* Logo and Branding */}
      <div className="text-center space-y-4 max-w-2xl">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-2xl font-bold">
            SG
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">SyncGrid</h1>
        <p className="text-xl text-muted-foreground">
          Enterprise-Grade Agency ERP & Company Management System
        </p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          A modern, scalable foundation for enterprise SaaS applications. Built with Next.js,
          Tailwind CSS, and cutting-edge technologies.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <Link href="/dashboard">
          <Button size="lg">Get Started</Button>
        </Link>
        <Link href="https://github.com" target="_blank">
          <Button variant="outline" size="lg">
            View on GitHub
          </Button>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full mt-12">
        {[
          {
            title: "Scalable Architecture",
            description: "Built for enterprise-scale applications",
          },
          {
            title: "Modern Tech Stack",
            description: "Next.js, React, Tailwind, Zustand, and more",
          },
          {
            title: "Production Ready",
            description: "Best practices and optimized for performance",
          },
          {
            title: "Responsive Design",
            description: "Mobile, tablet, and desktop support",
          },
          {
            title: "Dark Mode",
            description: "Built-in theme support with persistence",
          },
          {
            title: "Component Library",
            description: "Comprehensive set of reusable components",
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-6 space-y-2"
          >
            <h3 className="font-semibold">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
