import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Calendar, Target, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="flex flex-col relative overflow-hidden">
      {/* Modern Hero Section with Gradient Background */}
      <section className="relative min-h-[90vh] md:min-h-[85vh] flex items-center justify-center px-4 md:px-6 py-20">
        {/* Animated Gradient Background - Using Brand Colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-teal-950 dark:to-slate-900">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-teal-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-full blur-2xl animate-pulse delay-500" />
        </div>

        {/* Geometric Shapes - Using Brand Colors */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 border-2 border-teal-300/30 rounded-lg rotate-12 animate-float" />
          <div className="absolute top-40 right-20 w-16 h-16 border-2 border-purple-300/30 rounded-full animate-float delay-300" />
          <div className="absolute bottom-32 left-1/4 w-12 h-12 border-2 border-amber-300/30 rotate-45 animate-float delay-700" />
          <div className="absolute bottom-20 right-1/3 w-24 h-24 border-2 border-emerald-300/30 rounded-lg rotate-6 animate-float delay-1000" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 container mx-auto max-w-6xl text-center">
          <div
            className={`transition-all duration-1000 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-teal-200/50 dark:border-teal-700/50 shadow-lg">
              <Sparkles className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Supporting recovery journeys
              </span>
            </div>

            {/* Main Heading - Bold Typography */}
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight"
              data-testid="text-hero-title"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-teal-800 to-slate-900 dark:from-white dark:via-teal-300 dark:to-white">
                Your Recovery,
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-purple-500 to-blue-400">
                One Moment at a Time
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
              data-testid="text-hero-subtitle"
            >
              Build daily structure and accountability through{" "}
              <span className="font-semibold text-teal-600 dark:text-teal-400">check-ins</span>,{" "}
              <span className="font-semibold text-purple-600 dark:text-purple-400">goal setting</span>, and{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">journaling</span>.
              Take control of your your life.
            </p>

            {/* CTA Buttons with Micro-interactions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/handler/sign-in" data-testid="link-get-started" className="group">
                <Button
                  size="lg"
                  className="text-lg px-10 py-7 rounded-full bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-700 hover:to-purple-700 shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-7 rounded-full border-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Learn More
              </Button>
            </div>

            {/* Social Proof - Brand Colors */}
            <div className="flex items-center justify-center gap-8 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-purple-400 border-2 border-white dark:border-slate-900" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 border-2 border-white dark:border-slate-900" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-amber-400 border-2 border-white dark:border-slate-900" />
                </div>
                <span className="font-medium">Join beta users</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Heart className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Trusted & Secure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-auto"
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="currentColor"
              className="text-white dark:text-slate-900"
            />
          </svg>
        </div>
      </section>

      {/* Modern Features Section with Cards */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-white dark:bg-slate-900">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-slate-900 dark:from-teal-300 dark:to-white">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Powerful tools designed specifically for your recovery journey
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Card 1 */}
            <div
              className="group relative p-8 rounded-3xl bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-950/30 dark:to-blue-950/30 hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-500 hover:-translate-y-2 border border-teal-100 dark:border-teal-900/30"
              data-testid="card-feature-checkin"
            >
              <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                Daily Check-Ins
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Start each day with intention. Track your feelings and stay connected to your progress.
              </p>
              <div className="pt-4 border-t border-teal-200/50 dark:border-teal-800/50">
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  "Daily routines and structure lower relapse risk and help support lasting recovery, according to clinical research."
                </p>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div
              className="group relative p-8 rounded-3xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 border border-purple-100 dark:border-purple-900/30"
              data-testid="card-feature-goals"
            >
              <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                Goal Setting
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Set achievable daily goals that build momentum and reinforce positive habits.
              </p>
              <div className="pt-4 border-t border-purple-200/50 dark:border-purple-800/50">
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  "Goal setting and regular check-ins boost engagement in treatment and increase the likelihood of maintaining sobriety."
                </p>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div
              className="group relative p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-2 border border-emerald-100 dark:border-emerald-900/30"
              data-testid="card-feature-journal"
            >
              <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                Journaling
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Express your thoughts and emotions in a safe, private space for personal growth.
              </p>
              <div className="pt-4 border-t border-emerald-200/50 dark:border-emerald-800/50">
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  "Journaling during recovery is linked to improved mood and self-awareness, supporting long-term success."
                </p>
              </div>
            </div>

            {/* Feature Card 4 */}
            <div
              className="group relative p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 hover:-translate-y-2 border border-amber-100 dark:border-amber-900/30"
              data-testid="card-feature-support"
            >
              <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                Recovery Support
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Built specifically for your journey with understanding, empathy, and respect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-700 {
          animation-delay: 700ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}