import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Heart, Activity, Pill, Calendar, Shield, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const features = [
    {
      icon: Pill,
      title: 'Medication Tracking',
      description: 'Never miss a dose with smart reminders and detailed scheduling for all your medications.',
    },
    {
      icon: Activity,
      title: 'Health Metrics',
      description: 'Monitor vital signs like blood pressure, heart rate, and blood sugar with visual trends.',
    },
    {
      icon: Calendar,
      title: 'Appointment Management',
      description: 'Keep track of all your medical appointments and get timely reminders.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with enterprise-grade security.',
    },
  ]

  const benefits = [
    'Track unlimited medications and schedules',
    'Visualize health trends over time',
    'Store emergency contact information',
    'Access from any device, anywhere',
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">CareBridge</span>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary mb-6">
            <TrendingUp className="h-4 w-4" />
            Your personal health companion
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Take Control of Your
            <span className="text-primary block">Health Journey</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
            Track medications, monitor vital signs, and manage appointments all in one secure platform designed for your wellness.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/sign-up">
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to manage your health effectively
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-shadow"
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose CareBridge?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Built with your privacy and health in mind. Our platform makes it simple to stay on top of your wellness routine.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="p-1 bg-primary/20 rounded-full">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8">
                <Link href="/auth/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="p-6 bg-card rounded-xl border">
                  <Activity className="h-8 w-8 text-primary mb-3" />
                  <p className="text-2xl font-bold">98%</p>
                  <p className="text-sm text-muted-foreground">Medication adherence</p>
                </div>
                <div className="p-6 bg-primary text-primary-foreground rounded-xl">
                  <Shield className="h-8 w-8 mb-3" />
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-sm opacity-90">Data encrypted</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="p-6 bg-card rounded-xl border">
                  <Calendar className="h-8 w-8 text-primary mb-3" />
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="text-sm text-muted-foreground">Access anywhere</p>
                </div>
                <div className="p-6 bg-card rounded-xl border">
                  <Heart className="h-8 w-8 text-primary mb-3" />
                  <p className="text-2xl font-bold">10k+</p>
                  <p className="text-sm text-muted-foreground">Happy users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Start Your Health Journey?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            Join thousands of users who trust CareBridge to manage their daily health routine.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/auth/sign-up">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">CareBridge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your trusted partner in personal health management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
