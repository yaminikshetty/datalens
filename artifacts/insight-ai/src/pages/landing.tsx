import { motion } from "framer-motion";
import { Link } from "wouter";
import { Activity, BarChart2, Shield, Zap, ArrowRight, Database, Server, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full border-b border-white/5 bg-background/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-6 w-6" />
            <span className="font-bold text-xl tracking-tight text-white">DataLens</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-muted-foreground hover:text-white">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div initial="initial" animate="animate" variants={staggerContainer} className="max-w-3xl mx-auto space-y-8">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              <span>Next-generation BI for engineers</span>
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Mission control for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">data infrastructure</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-muted-foreground">
              DataLens is a precision instrument for teams who take data seriously. Dense with information, instantly responsive, and built for engineers who live inside dashboards.
            </motion.p>
            <motion.div variants={fadeIn} className="flex items-center justify-center gap-4 pt-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90">
                  Start Building <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/10 hover:bg-white/5">
                  View Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Features Grid */}
      <section className="py-24 px-6 border-y border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 p-6 rounded-2xl bg-card border border-white/5 shadow-2xl">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BarChart2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Precision Metrics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track every critical KPI with sub-second latency. Our sparklines and dense data tables give you the full story at a glance.
              </p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-card border border-white/5 shadow-2xl">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">AI-Powered Queries</h3>
              <p className="text-muted-foreground leading-relaxed">
                Stop writing boilerplate SQL. Ask questions in natural language and get instantly generated charts and insights from your data warehouse.
              </p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-card border border-white/5 shadow-2xl">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Custom Reporting</h3>
              <p className="text-muted-foreground leading-relaxed">
                Build complex performance, trend, and comparison reports in seconds. Export, share, and automate your entire reporting pipeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Built for speed and density</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every pixel is optimized for data consumption. No wasted space, no unnecessary padding. Just the information you need, when you need it.
            </p>
          </div>
          
          {/* Mock Dashboard UI */}
          <div className="rounded-xl border border-white/10 bg-card shadow-2xl overflow-hidden flex flex-col">
            <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-background/50">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="mx-auto h-6 w-64 bg-background rounded text-xs flex items-center justify-center text-muted-foreground border border-white/5">
                datalens.app/dashboard
              </div>
            </div>
            <div className="p-8 grid md:grid-cols-4 gap-6 bg-background">
              <div className="md:col-span-1 space-y-6">
                <div className="h-24 rounded-lg bg-card border border-white/5 p-4 flex flex-col justify-between">
                  <div className="h-4 w-24 bg-white/10 rounded" />
                  <div className="h-8 w-32 bg-primary/20 rounded" />
                </div>
                <div className="h-24 rounded-lg bg-card border border-white/5 p-4 flex flex-col justify-between">
                  <div className="h-4 w-24 bg-white/10 rounded" />
                  <div className="h-8 w-32 bg-white/5 rounded" />
                </div>
                <div className="h-24 rounded-lg bg-card border border-white/5 p-4 flex flex-col justify-between">
                  <div className="h-4 w-24 bg-white/10 rounded" />
                  <div className="h-8 w-32 bg-white/5 rounded" />
                </div>
              </div>
              <div className="md:col-span-3 space-y-6">
                <div className="h-64 rounded-lg bg-card border border-white/5 p-6">
                  <div className="h-4 w-48 bg-white/10 rounded mb-8" />
                  <div className="flex items-end h-32 gap-2">
                    {[40, 70, 45, 90, 65, 85, 100, 55, 75, 50, 80, 60].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/80 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="h-48 rounded-lg bg-card border border-white/5 p-6">
                  <div className="h-4 w-32 bg-white/10 rounded mb-6" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="h-4 w-48 bg-white/5 rounded" />
                        <div className="h-4 w-16 bg-white/10 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" />
            <span className="font-bold text-white tracking-tight">DataLens</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DataLens SaaS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
