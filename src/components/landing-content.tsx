'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ============================================
// ICON COMPONENT
// ============================================

const ICONS: Record<string, React.ReactNode> = {
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  book: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>,
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  gift: <><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></>,
  chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  mic: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>,
  award: <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>,
  clipboard: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></>,
  briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  compass: <><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>,
  check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
}

function Icon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  )
}

// ============================================
// HOOKS
// ============================================

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isInView }
}

function useCountUp(target: number, duration = 2000, shouldStart = false) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!shouldStart || started.current) return
    started.current = true
    const startTime = performance.now()

    function update(now: number) {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(update)
    }

    requestAnimationFrame(update)
  }, [shouldStart, target, duration])

  return count
}

// ============================================
// DATA
// ============================================

type TabKey = 'teenagers' | 'youngAdults' | 'parents' | 'elderly'

const BENEFIT_TABS: Record<TabKey, { label: string; age: string; benefits: { icon: string; title: string; desc: string }[] }> = {
  teenagers: {
    label: 'Teenagers',
    age: '13 - 19',
    benefits: [
      { icon: 'compass', title: 'Priority Camp Sign-ups', desc: 'First access to Al-Fateh camps and youth retreats' },
      { icon: 'clipboard', title: 'Volunteer Hour Tracking', desc: 'Track CIP/NS volunteer hours through mosque activities' },
      { icon: 'award', title: 'Young Contributor Badge', desc: 'Recognition for youth who give back to the community' },
      { icon: 'users', title: 'Invite Friends Feature', desc: 'Bring friends to events and earn referral rewards' },
      { icon: 'trophy', title: 'Sports Facility Booking', desc: 'Priority access to mosque sports and recreation facilities' },
    ],
  },
  youngAdults: {
    label: 'Young Adults',
    age: '20 - 35',
    benefits: [
      { icon: 'briefcase', title: 'Career Networking Events', desc: 'Connect with Muslim professionals in your field' },
      { icon: 'compass', title: 'Skills Workshops', desc: 'Financial literacy, public speaking, and more' },
      { icon: 'trophy', title: 'Sports Facility Access', desc: 'Book courts and gym facilities at member rates' },
      { icon: 'star', title: 'Volunteer Leadership Roles', desc: 'Lead community projects and build your portfolio' },
    ],
  },
  parents: {
    label: 'Parents',
    age: '30 - 50',
    benefits: [
      { icon: 'check', title: 'aLIVE Programme Priority', desc: "First registration for children's enrichment programmes" },
      { icon: 'book', title: 'Raudhatul Quran Discounts', desc: 'Reduced fees for Quran memorisation classes' },
      { icon: 'award', title: "Kids' Milestone Certificates", desc: "Track and celebrate your children's Islamic education journey" },
      { icon: 'gift', title: 'Family Event Invitations', desc: 'Exclusive access to family outings and community gatherings' },
    ],
  },
  elderly: {
    label: 'Elderly',
    age: '60+',
    benefits: [
      { icon: 'shield', title: 'Emergency Assistance Priority', desc: 'First in line for welfare support during hardship' },
      { icon: 'book', title: 'Mosque Library Access', desc: 'Borrow physical and digital Islamic resources' },
      { icon: 'heart', title: 'Senior Wellness Programmes', desc: 'Health talks, gentle exercise, and social activities' },
      { icon: 'award', title: 'Community Recognition', desc: 'Honoured for years of service and dedication' },
    ],
  },
}

const PERKS = [
  { icon: 'chart', title: 'Monthly Impact Report', desc: 'See exactly how your $5 helped' },
  { icon: 'moon', title: 'Ramadan Multiplier', desc: 'Extra sadaqah jariyah during the blessed month' },
  { icon: 'shield', title: 'Emergency Assistance Fund', desc: 'Priority welfare support during hardship' },
  { icon: 'mic', title: 'Exclusive Lecture Series', desc: 'Monthly members-only talks with local asatizah' },
  { icon: 'gift', title: 'Hari Raya Care Package', desc: 'Annual gift for active members' },
  { icon: 'heart', title: 'Sponsor a Family', desc: 'Add $5 to cover a family in need' },
  { icon: 'book', title: 'Mosque Library Access', desc: 'Physical and digital Islamic resources' },
  { icon: 'award', title: 'Community Recognition', desc: 'From thank-you cards to lifetime membership' },
]

const PRICING = [
  {
    name: 'Individual',
    price: 5,
    popular: false,
    features: ['Monthly impact report', 'Emergency assistance eligibility', 'Lecture series access', 'Hari Raya care package', 'Mosque library access', 'Volunteer hour tracking'],
  },
  {
    name: 'Family',
    price: 20,
    popular: true,
    features: ['All Individual benefits', 'Coverage for up to 5 family members', 'aLIVE programme priority', 'Raudhatul Quran discounts', 'Family event invitations', "Kids' milestone certificates", 'Sports facility booking'],
  },
  {
    name: 'Sponsor + Individual',
    price: 10,
    popular: false,
    features: ['All Individual benefits for you', 'Sponsor a family in need', 'Sponsor recognition badge', 'Extra sadaqah jariyah credit', 'Community appreciation mention'],
  },
]

const MILESTONES = [
  { duration: '6 Months', reward: 'Personal thank-you card' },
  { duration: '1 Year', reward: '"Founding Supporter" recognition' },
  { duration: '2 Years', reward: 'Name on community appreciation wall' },
  { duration: '5 Years', reward: 'Lifetime membership (no more payments)' },
]

const IMPACT_STATS = [
  { target: 15, suffix: '', label: 'Students in Quran Classes' },
  { target: 3, suffix: '', label: 'Families Received Groceries' },
  { target: 8, suffix: '', label: 'Community Events' },
  { target: 120, suffix: '+', label: 'Volunteer Hours' },
]

const HERO_STATS = [
  { target: 2000, suffix: '+', label: 'Members' },
  { target: 500, suffix: '+', label: 'Families' },
  { target: 300, suffix: '+', label: 'Students' },
]

// ============================================
// SUB-COMPONENTS
// ============================================

function Counter({ target, suffix = '', active }: { target: number; suffix?: string; active: boolean }) {
  const count = useCountUp(target, 2000, active)
  return <>{count.toLocaleString()}{suffix}</>
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LandingContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('teenagers')
  const [navScrolled, setNavScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [heroReady, setHeroReady] = useState(false)

  const impactView = useInView(0.3)

  // Hero entrance delay
  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 300)
    return () => clearTimeout(t)
  }, [])

  // Nav scroll
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed')
          observer.unobserve(e.target)
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal, .reveal-scale').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const tabData = BENEFIT_TABS[activeTab]
  const navLink = `text-sm font-medium transition-colors ${navScrolled ? 'text-gray-600 hover:text-primary-800' : 'text-white/80 hover:text-white'}`

  return (
    <main className="bg-white overflow-x-hidden">

      {/* ================================================================ */}
      {/* NAVIGATION                                                       */}
      {/* ================================================================ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(6,95,70,0.08)]' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${navScrolled ? 'bg-primary-800 text-white' : 'bg-white/15 text-white'}`}>SP</div>
            <div>
              <span className={`text-lg font-bold tracking-tight ${navScrolled ? 'text-primary-900' : 'text-white'}`}>Skim Pintar</span>
              <span className={`hidden sm:inline ml-2 text-xs font-medium ${navScrolled ? 'text-gray-400' : 'text-white/50'}`}>Masjid Ar-Raudhah</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#benefits" className={navLink}>Benefits</a>
            <a href="#pricing" className={navLink}>Pricing</a>
            <a href="#impact" className={navLink}>Impact</a>
            <Link href="/my" className={navLink}>My Dashboard</Link>
            <Link href="/pledge" className="bg-primary-700 hover:bg-primary-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-primary-900/20">
              Become a Member
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden relative w-6 h-5" aria-label="Toggle menu">
            <span className={`absolute left-0 h-0.5 w-6 rounded transition-all duration-300 ${navScrolled ? 'bg-gray-700' : 'bg-white'} ${mobileMenuOpen ? 'top-2.5 rotate-45' : 'top-0'}`} />
            <span className={`absolute left-0 top-2 h-0.5 w-6 rounded transition-all duration-300 ${navScrolled ? 'bg-gray-700' : 'bg-white'} ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`absolute left-0 h-0.5 w-6 rounded transition-all duration-300 ${navScrolled ? 'bg-gray-700' : 'bg-white'} ${mobileMenuOpen ? 'top-2.5 -rotate-45' : 'top-4'}`} />
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-80 border-t border-gray-100' : 'max-h-0'} bg-white`}>
          <div className="px-6 py-4 flex flex-col gap-3">
            <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2">Benefits</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2">Pricing</a>
            <a href="#impact" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2">Impact</a>
            <Link href="/my" className="text-sm font-medium text-gray-700 py-2">My Dashboard</Link>
            <Link href="/pledge" className="bg-primary-700 text-white text-center px-5 py-2.5 rounded-lg text-sm font-semibold mt-1">Become a Member</Link>
          </div>
        </div>
      </nav>

      {/* ================================================================ */}
      {/* HERO                                                             */}
      {/* ================================================================ */}
      <section className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden">
        {/* Islamic pattern overlay */}
        <div className="absolute inset-0 islamic-pattern-dark pointer-events-none" aria-hidden="true" />

        {/* Mosque silhouette */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-[0.06]" aria-hidden="true">
          <svg viewBox="0 0 1440 220" fill="currentColor" className="w-full text-white" preserveAspectRatio="xMidYMax meet">
            <rect x="185" y="50" width="14" height="170" rx="2" />
            <path d="M182 50 Q192 20 202 50" />
            <path d="M340 220 L340 150 Q410 85 480 150 L480 220 Z" />
            <path d="M540 220 L540 110 Q720 -10 900 110 L900 220 Z" />
            <path d="M960 220 L960 150 Q1030 85 1100 150 L1100 220 Z" />
            <rect x="1241" y="50" width="14" height="170" rx="2" />
            <path d="M1238 50 Q1248 20 1258 50" />
          </svg>
        </div>

        {/* Curved section divider */}
        <div className="absolute -bottom-1 left-0 right-0 z-10" aria-hidden="true">
          <svg viewBox="0 0 1440 80" fill="white" preserveAspectRatio="none" className="w-full h-12 sm:h-20">
            <path d="M0 80 C360 10 1080 10 1440 80 L1440 80 L0 80 Z" />
          </svg>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-32 text-center">
          <p className={`text-sm font-semibold text-gold-400 uppercase tracking-[0.2em] mb-5 transition-all duration-700 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Masjid Ar-Raudhah
          </p>
          <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight transition-all duration-700 delay-100 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Be Part of Something<br />
            <span className="bg-gradient-to-r from-primary-200 via-gold-300 to-primary-200 bg-clip-text text-transparent">Greater Than Yourself</span>
          </h1>
          <p className={`mt-6 text-base sm:text-lg text-primary-100/90 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Masjid Ar-Raudhah&apos;s official membership programme. Join 2,000+ members building community through education, welfare, and faith — from just $5/month.
          </p>

          {/* CTAs */}
          <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <Link href="/pledge" className="bg-primary-500 hover:bg-primary-400 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all shadow-xl shadow-primary-950/30 hover:shadow-2xl hover:shadow-primary-950/40 hover:-translate-y-0.5">
              Become a Member
            </Link>
            <a href="#benefits" className="border-2 border-white/25 hover:border-white/50 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5">
              See All Benefits
            </a>
          </div>

          {/* Animated stats */}
          <div className={`mt-16 flex items-center justify-center gap-8 sm:gap-16 transition-all duration-700 delay-500 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-white">
                  <Counter target={stat.target} suffix={stat.suffix} active={heroReady} />
                </div>
                <div className="text-xs sm:text-sm text-primary-200/70 font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* BENEFITS - TAILORED FOR EVERY AGE                                */}
      {/* ================================================================ */}
      <section id="benefits" className="relative py-24 sm:py-32 bg-white islamic-pattern scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center reveal">
            <p className="text-sm font-semibold text-gold-600 uppercase tracking-wider">Membership Benefits</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-primary-900 tracking-tight">Tailored for Every Age</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold-500" />
            <p className="mt-4 text-gray-500 max-w-lg mx-auto">From teenagers to seniors, every member gets benefits designed for their stage of life.</p>
          </div>

          {/* Tab selector */}
          <div className="mt-12 flex flex-wrap justify-center gap-2 reveal reveal-delay-1">
            {(Object.keys(BENEFIT_TABS) as TabKey[]).map((key) => {
              const tab = BENEFIT_TABS[key]
              const active = activeTab === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-primary-800 text-white shadow-lg shadow-primary-900/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {tab.label} <span className={`ml-1 text-xs ${active ? 'text-primary-200' : 'text-gray-400'}`}>{tab.age}</span>
                </button>
              )
            })}
          </div>

          {/* Benefits grid */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tabData.benefits.map((b, i) => (
              <div key={`${activeTab}-${i}`} className="reveal reveal-scale bg-white border border-gray-100 rounded-2xl p-6 card-hover">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 mb-4">
                  <Icon name={b.icon} className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-primary-900 text-base">{b.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* PERKS - FOR EVERYONE                                             */}
      {/* ================================================================ */}
      <section id="perks" className="py-24 sm:py-32 bg-warmWhite scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center reveal">
            <p className="text-sm font-semibold text-gold-600 uppercase tracking-wider">Member Perks</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-primary-900 tracking-tight">For Everyone</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold-500" />
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map((perk, i) => (
              <div key={i} className={`reveal reveal-delay-${Math.min(i, 7)} gold-shimmer bg-white rounded-2xl p-6 border border-gray-100 card-hover`}>
                <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center text-gold-700 mb-4">
                  <Icon name={perk.icon} className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-primary-900 text-sm">{perk.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* PRICING                                                          */}
      {/* ================================================================ */}
      <section id="pricing" className="py-24 sm:py-32 bg-white islamic-pattern scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center reveal">
            <p className="text-sm font-semibold text-gold-600 uppercase tracking-wider">Simple Pricing</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-primary-900 tracking-tight">Choose Your Plan</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold-500" />
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3 items-start">
            {PRICING.map((plan, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} rounded-2xl overflow-hidden ${
                  plan.popular
                    ? 'pricing-popular text-white shadow-2xl shadow-primary-900/30 ring-2 ring-gold-400 lg:-mt-4 lg:mb-[-16px]'
                    : 'bg-white border border-gray-200 card-hover'
                }`}
              >
                {plan.popular && (
                  <div className="bg-gold-500 text-white text-xs font-bold uppercase tracking-wider text-center py-2">
                    Most Popular
                  </div>
                )}
                <div className="p-8">
                  <h3 className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-primary-900'}`}>{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className={`text-5xl font-extrabold ${plan.popular ? 'text-white' : 'text-primary-900'}`}>${plan.price}</span>
                    <span className={`text-sm ${plan.popular ? 'text-primary-200' : 'text-gray-400'}`}>/month</span>
                  </div>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-gold-300' : 'text-primary-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className={`text-sm ${plan.popular ? 'text-primary-100' : 'text-gray-600'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/pledge"
                    className={`mt-8 block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                      plan.popular
                        ? 'bg-white text-primary-800 hover:bg-primary-50 shadow-lg'
                        : 'bg-primary-800 text-white hover:bg-primary-700 shadow-lg shadow-primary-900/15'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-gray-500 reveal">
            250% tax deduction on donations (IPC-registered mosque). Cash payment available at mosque counter.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* LOYALTY REWARDS                                                  */}
      {/* ================================================================ */}
      <section id="rewards" className="py-24 sm:py-32 bg-cream scroll-mt-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center reveal">
            <p className="text-sm font-semibold text-gold-600 uppercase tracking-wider">Loyalty Rewards</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-primary-900 tracking-tight">The Longer You Stay, the More You Get</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold-500" />
          </div>

          <div className="mt-14 relative">
            {/* Timeline line */}
            <div className="absolute left-[23px] top-2 bottom-2 w-0.5 timeline-line" aria-hidden="true" />

            <div className="space-y-10">
              {MILESTONES.map((m, i) => (
                <div key={i} className={`reveal reveal-delay-${i + 1} flex items-start gap-6`}>
                  <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-900/20">
                    <span className="text-white text-sm font-bold">{i + 1}</span>
                  </div>
                  <div className="pt-2.5">
                    <p className="text-sm font-bold text-gold-700 uppercase tracking-wider">{m.duration}</p>
                    <p className="mt-1 text-base text-primary-900 font-medium">{m.reward}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* IMPACT                                                           */}
      {/* ================================================================ */}
      <section id="impact" className="py-24 sm:py-32 hero-gradient relative overflow-hidden scroll-mt-20">
        <div className="absolute inset-0 islamic-pattern-dark pointer-events-none" aria-hidden="true" />
        <div ref={impactView.ref} className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="reveal">
            <p className="text-sm font-semibold text-gold-400 uppercase tracking-wider">Real Impact</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Every Dollar Creates Measurable Change</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold-500" />
          </div>

          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {IMPACT_STATS.map((stat, i) => (
              <div key={i} className={`reveal reveal-delay-${i + 1}`}>
                <div className="text-4xl sm:text-5xl font-extrabold text-white">
                  <Counter target={stat.target} suffix={stat.suffix} active={impactView.isInView} />
                </div>
                <div className="mt-2 text-sm text-primary-200/80 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          <p className="mt-12 text-primary-100/70 text-sm max-w-md mx-auto reveal">
            Numbers from the past month. Updated quarterly in our transparency report.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CTA                                                              */}
      {/* ================================================================ */}
      <section className="py-24 sm:py-32 bg-white islamic-pattern">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-900 tracking-tight reveal">
            Ready to Join Our Community?
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold-500 reveal reveal-delay-1" />

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 reveal reveal-delay-2">
            <Link href="/pledge" className="bg-primary-800 hover:bg-primary-700 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all shadow-xl shadow-primary-900/20 hover:-translate-y-0.5">
              Become a Member
            </Link>
            <Link href="/pledge" className="border-2 border-primary-200 hover:border-primary-300 text-primary-800 px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5">
              Gift a Membership
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-500 max-w-md mx-auto leading-relaxed reveal reveal-delay-3">
            Can&apos;t afford it? No problem. Ask a member to sponsor your family — it&apos;s what community is for.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER                                                           */}
      {/* ================================================================ */}
      <footer className="bg-primary-950 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-sm">SP</div>
                <span className="text-lg font-bold text-white tracking-tight">Skim Pintar</span>
              </div>
              <p className="mt-3 text-sm text-primary-300/60 leading-relaxed">
                Masjid Ar-Raudhah&apos;s official membership programme. Building community through education, welfare, and faith.
              </p>
              <p className="mt-3 text-xs text-primary-300/40">1 Jln Kuak, Singapore 799316</p>
            </div>

            {/* Membership */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Membership</h4>
              <ul className="space-y-2.5">
                <li><a href="#benefits" className="text-sm text-primary-300/60 hover:text-white transition-colors">Benefits</a></li>
                <li><a href="#pricing" className="text-sm text-primary-300/60 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#rewards" className="text-sm text-primary-300/60 hover:text-white transition-colors">Rewards</a></li>
                <li><a href="#perks" className="text-sm text-primary-300/60 hover:text-white transition-colors">Perks</a></li>
              </ul>
            </div>

            {/* Programmes */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Programmes</h4>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-primary-300/60">aLIVE</span></li>
                <li><span className="text-sm text-primary-300/60">Raudhatul Quran</span></li>
                <li><span className="text-sm text-primary-300/60">Al-Fateh Youth</span></li>
                <li><span className="text-sm text-primary-300/60">Hijrah Walk</span></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-primary-300/60">Visit Mosque Counter</span></li>
                <li><span className="text-sm text-primary-300/60">Cash Payment</span></li>
                <li><Link href="/my" className="text-sm text-primary-300/60 hover:text-white transition-colors">My Dashboard</Link></li>
                <li>
                  <a href="https://arraudhahmosque.com" target="_blank" rel="noopener noreferrer" className="text-sm text-primary-300/60 hover:text-white transition-colors">
                    arraudhahmosque.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-primary-300/40">
              Masjid Ar-Raudhah. All rights reserved. 2026
            </p>
            <Link href="/admin" className="text-xs text-primary-300/20 hover:text-primary-300/50 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
