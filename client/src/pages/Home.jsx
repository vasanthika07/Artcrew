import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, MapPin, Palette, Volume2, VolumeX, ChevronDown, Crown, Star, Play
} from 'lucide-react';
import api from '../api/axios';
import MediumCard from '../components/MediumCard';
import LiveSessionCard from '../components/LiveSessionCard';
import RecordedSessionCard from '../components/RecordedSessionCard';

/* ── Floating paint blob ── */
const PaintBlob = ({ color, top, left, size, delay, opacity = '0.15' }) => (
  <div
    className="absolute rounded-full blur-3xl animate-float pointer-events-none"
    style={{ background: color, width: size, height: size, top, left, animationDelay: delay, opacity }}
    aria-hidden="true"
  />
);

/* ── Stat counter ── */
const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="font-display font-bold text-3xl md:text-4xl text-white mb-1">{value}</div>
    <div className="text-charcoal-400 text-xs uppercase tracking-[0.12em] font-medium">{label}</div>
  </div>
);

/* ── Section header ── */
const SectionHeader = ({ eyebrow, title, subtitle, linkTo, linkLabel, dark = false }) => (
  <div className="flex items-end justify-between mb-10">
    <div>
      <p className={`eyebrow${dark ? '-light' : ''}`}>{eyebrow}</p>
      <h2 className={`font-display font-bold text-3xl md:text-4xl mb-2 leading-tight ${dark ? 'text-white' : 'text-charcoal-900'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base max-w-xl ${dark ? 'text-charcoal-400' : 'text-charcoal-500'}`}>{subtitle}</p>
      )}
    </div>
    {linkTo && (
      <Link
        to={linkTo}
        className={`hidden sm:flex items-center gap-1.5 text-sm font-semibold transition-colors group ${
          dark ? 'text-canvas-400 hover:text-canvas-300' : 'text-canvas-600 hover:text-canvas-700'
        }`}
      >
        {linkLabel}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
      </Link>
    )}
  </div>
);

/* ── Skeleton card ── */
const MediumSkeleton = () => (
  <div className="card-editorial">
    <div className="skeleton aspect-[4/3]" />
    <div className="p-5 space-y-3">
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-2/3 rounded" />
    </div>
  </div>
);

const Home = () => {
  const [mediums,    setMediums]    = useState([]);
  const [gallery,    setGallery]    = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Background video sound state
  const bgVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    if (bgVideoRef.current) {
      bgVideoRef.current.muted = !bgVideoRef.current.muted;
      setIsMuted(bgVideoRef.current.muted);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/mediums').then(r => setMediums(r.data.data?.slice(0, 6) || [])),
      api.get('/gallery?featured=true&limit=6').then(r => setGallery(r.data.data || [])),
      api.get('/live-sessions?limit=3').then(r => setLiveSessions(r.data.data?.slice(0, 3) || [])),
      api.get('/recordings?limit=4').then(r => setRecordings(r.data.data?.slice(0, 4) || [])),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-x-hidden">

      {/* ════════════════════════════════════════════
          HERO (Symmetrical Layout & Ambient Background Video)
      ════════════════════════════════════════════ */}
      <section className="relative min-h-hero flex items-center bg-charcoal-950 overflow-hidden py-16 sm:py-20 lg:py-24" aria-label="Hero">
        
        {/* Landscape background video with subtle, soft ambient opacity */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" aria-hidden="true">
          <video
            ref={bgVideoRef}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => {
              if (bgVideoRef.current) bgVideoRef.current.play().catch(() => {});
            }}
            className="w-full h-full object-cover object-center opacity-18 scale-100 transition-opacity duration-700"
          >
            <source src="/images/dashboard/dashboard-video.mp4" type="video/mp4" />
            <source src="/images/dashboard/WhatsApp Video 2026-09-19 at 23.20.19.mp4" type="video/mp4" />
          </video>
          {/* Refined gradient overlays for optimal text clarity and soft cinematic depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/95 via-charcoal-950/70 to-charcoal-950/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-transparent to-charcoal-950/60" />
        </div>

        {/* Ambient blobs */}
        <PaintBlob color="#d4892a" top="5%"  left="65%" size="500px" delay="0s"   opacity="0.10" />
        <PaintBlob color="#d9522c" top="55%" left="5%"  size="350px" delay="2s"   opacity="0.08" />
        <PaintBlob color="#478a41" top="15%" left="-5%" size="250px" delay="4s"   opacity="0.06" />
        <PaintBlob color="#d4892a" top="70%" left="80%" size="200px" delay="1.5s" opacity="0.07" />

        <div className="container-art relative z-10 w-full">
          {/* Symmetrical 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center mb-14 sm:mb-16">
            
            {/* Left Column: Headline, Description & Primary Actions */}
            <div className="lg:col-span-7 flex flex-col justify-center text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-canvas-500/15 border border-canvas-500/25 text-canvas-300 text-xs font-semibold mb-6 animate-fade-in tracking-wide uppercase w-fit">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                India's Premier Art Discovery Platform
              </div>

              {/* Headline */}
              <h1 className="display-hero text-4xl sm:text-5xl lg:text-6xl text-white mb-5 animate-fade-up leading-[1.15]" style={{ animationDelay: '0.1s' }}>
                Discover Your{' '}
                <span className="relative inline-block">
                  <span className="gradient-text">Art Medium</span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 10"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M2 8 C80 2, 200 2, 298 8" stroke="#d4892a" strokeWidth="2.5" strokeLinecap="round" className="opacity-50" />
                  </svg>
                </span>
                <br />& Find Your Studio
              </h1>

              <p className="text-charcoal-300 text-base sm:text-lg mb-8 leading-relaxed max-w-xl animate-fade-up" style={{ animationDelay: '0.2s' }}>
                From watercolour landscapes to pottery wheels — explore art mediums,
                watch live masterclasses, and find studios near you. Let our AI guide your creative journey.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 animate-fade-up mb-8" style={{ animationDelay: '0.3s' }}>
                <Link to="/mediums" className="btn-primary btn-lg group">
                  <Palette className="w-5 h-5" aria-hidden="true" />
                  Explore Mediums
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
                <Link to="/studios" className="btn-white-ghost btn-lg">
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                  Find Studios
                </Link>
                <Link to="/assistant" className="btn btn-lg border border-canvas-500/35 bg-canvas-500/10 text-canvas-300 hover:bg-canvas-500/20 hover:border-canvas-500/60 transition-all">
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  Ask AI Advisor
                </Link>
              </div>

              {/* Feature Highlights Pills */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-400 animate-fade-up" style={{ animationDelay: '0.35s' }}>
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 5+ Curated Mediums</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Verified Indian Studios</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> AI Match Engine</span>
              </div>
            </div>

            {/* Right Column: Symmetrical Glass Showcase Cards */}
            <div className="lg:col-span-5 flex flex-col gap-4 animate-fade-up" style={{ animationDelay: '0.25s' }}>
              
              {/* Card 1: Featured Masterclass Card */}
              <div className="bg-charcoal-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl hover:border-canvas-500/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-canvas-400 bg-canvas-500/15 px-3 py-1 rounded-full border border-canvas-500/20">
                    Live Workshop
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Now Streaming
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-2">
                  Watercolour Landscapes & Fluidity
                </h3>
                <p className="text-charcoal-400 text-xs sm:text-sm mb-4 line-clamp-2">
                  Learn wet-on-wet watercolor layering, pigment ratios, and organic texture blending from certified studio artists.
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="text-xs text-charcoal-400">
                    <span className="text-white font-medium">All Skill Levels</span> • 45 Mins
                  </div>
                  <Link to="/live-sessions" className="text-xs font-semibold text-canvas-400 hover:text-canvas-300 flex items-center gap-1">
                    Join Session <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Quick Medium Navigator */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg">
                <p className="text-xs uppercase tracking-wider text-charcoal-400 font-semibold mb-3">Popular Mediums</p>
                <div className="flex flex-wrap gap-2">
                  {['Paintings', 'Pottery & Clay', 'Charcoal Sketching', 'Digital Art', 'Watercolour', 'Portraits'].map((tag) => (
                    <Link
                      key={tag}
                      to="/mediums"
                      className="text-xs px-3 py-1.5 rounded-lg bg-charcoal-800/80 hover:bg-canvas-500/20 text-charcoal-300 hover:text-white border border-white/5 hover:border-canvas-500/30 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Symmetrical Stats Bar Across Full Width */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-white/10 animate-fade-up"
            style={{ animationDelay: '0.4s' }}
            aria-label="Platform statistics"
          >
            <div className="bg-charcoal-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center">
              <div className="font-display font-bold text-2xl sm:text-3xl text-white mb-1">5+</div>
              <div className="text-charcoal-400 text-[11px] uppercase tracking-wider font-medium">Art Mediums</div>
            </div>
            <div className="bg-charcoal-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center">
              <div className="font-display font-bold text-2xl sm:text-3xl text-white mb-1">50+</div>
              <div className="text-charcoal-400 text-[11px] uppercase tracking-wider font-medium">Verified Studios</div>
            </div>
            <div className="bg-charcoal-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center">
              <div className="font-display font-bold text-2xl sm:text-3xl text-white mb-1">100%</div>
              <div className="text-charcoal-400 text-[11px] uppercase tracking-wider font-medium">Beginner Friendly</div>
            </div>
            <div className="bg-charcoal-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-center">
              <div className="font-display font-bold text-2xl sm:text-3xl text-white mb-1">24/7</div>
              <div className="text-charcoal-400 text-[11px] uppercase tracking-wider font-medium">AI Art Advisor</div>
            </div>
          </div>
        </div>

        {/* Ambient Audio Toggle in bottom right */}
        <div className="absolute bottom-6 right-6 z-20 hidden sm:block">
          <button
            type="button"
            onClick={toggleMute}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-charcoal-900/80 backdrop-blur-md border border-white/15 text-charcoal-300 hover:text-white text-xs transition-all shadow-lg hover:border-canvas-500/50"
            title={isMuted ? "Unmute background video sound" : "Mute background video sound"}
            aria-label={isMuted ? "Unmute background video sound" : "Mute background video sound"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-canvas-400" />}
            <span className="text-[11px] font-medium">{isMuted ? 'Sound off' : 'Sound on'}</span>
          </button>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1.5 text-charcoal-500 animate-bounce pointer-events-none" aria-hidden="true">
          <span className="text-[9px] uppercase tracking-[0.15em]">Scroll</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURED MEDIUMS
      ════════════════════════════════════════════ */}
      <section className="section bg-white" aria-labelledby="mediums-title">
        <div className="container-art">
          <SectionHeader
            eyebrow="Discover"
            title="Art Mediums"
            subtitle="Find the medium that speaks to you — from brushes to clay."
            linkTo="/mediums"
            linkLabel="View all"
          />
          <div id="mediums-title" className="sr-only">Featured Art Mediums</div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <MediumSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediums.map((medium, i) => (
                <div key={medium._id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <MediumCard medium={medium} />
                </div>
              ))}
            </div>
          )}

          <div className="sm:hidden mt-8 text-center">
            <Link to="/mediums" className="btn-outline">
              View all mediums <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          GALLERY PREVIEW
      ════════════════════════════════════════════ */}
      {gallery.length > 0 && (
        <section className="section bg-charcoal-950" aria-labelledby="gallery-title">
          <div className="container-art">
            <SectionHeader
              dark
              eyebrow="Exhibition"
              title="Featured Gallery"
              subtitle="Artwork created by our community of artists."
              linkTo="/gallery"
              linkLabel="Full Gallery"
            />
            <div id="gallery-title" className="sr-only">Featured Gallery</div>

            {/* Mosaic grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {gallery.slice(0, 6).map((item, i) => (
                <div
                  key={item._id}
                  className={`group overflow-hidden rounded-2xl relative cursor-pointer ${
                    i === 0 ? 'row-span-2' : ''
                  }`}
                  style={{ aspectRatio: i === 0 ? 'auto' : '1' }}
                  role="img"
                  aria-label={item.title}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-spring"
                    style={{ minHeight: i === 0 ? '300px' : 'auto' }}
                    loading="lazy"
                  />
                  <div className="gallery-hover-reveal" aria-hidden="true" />
                  <div className="absolute bottom-0 inset-x-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300" aria-hidden="true">
                    <p className="text-white font-display font-semibold text-sm">{item.title}</p>
                    {item.mediumId?.name && (
                      <span className="badge bg-canvas-500/80 text-white text-[10px] mt-1">{item.mediumId.name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="sm:hidden mt-6 text-center">
              <Link to="/gallery" className="btn border-2 border-charcoal-700 text-charcoal-300 hover:border-canvas-500 hover:text-canvas-400 transition-all">
                View Gallery <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════
          LIVE SESSIONS
      ════════════════════════════════════════════ */}
      {liveSessions.length > 0 && (
        <section className="section bg-canvas-50" aria-labelledby="live-title">
          <div className="container-art">
            <SectionHeader
              eyebrow="Live"
              title="Upcoming Sessions"
              subtitle="Join live art workshops with expert instructors in real-time."
              linkTo="/live-sessions"
              linkLabel="View all"
            />
            <div id="live-title" className="sr-only">Upcoming Live Sessions</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveSessions.map((s, i) => (
                <div key={s._id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <LiveSessionCard session={s} />
                </div>
              ))}
            </div>
            <div className="sm:hidden mt-6 text-center">
              <Link to="/live-sessions" className="btn-outline">
                View all sessions <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════
          WORKSHOP LIBRARY
      ════════════════════════════════════════════ */}
      {recordings.length > 0 && (
        <section className="section bg-charcoal-950" aria-labelledby="workshops-title">
          <div className="container-art">
            <SectionHeader
              dark
              eyebrow="On Demand"
              title="Workshop Library"
              subtitle="Stream premium art workshops at your own pace."
              linkTo="/recorded-sessions"
              linkLabel="Browse all"
            />
            <div id="workshops-title" className="sr-only">Workshop Library</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recordings.map((r, i) => (
                <div key={r._id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <RecordedSessionCard session={r} />
                </div>
              ))}
            </div>
            <div className="sm:hidden mt-6 text-center">
              <Link to="/recorded-sessions" className="btn border-2 border-charcoal-700 text-charcoal-300 hover:border-canvas-500 hover:text-canvas-400 transition-all">
                Browse workshops <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════
          AI ADVISOR CTA
      ════════════════════════════════════════════ */}
      <section className="section bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-charcoal-900 relative overflow-hidden" aria-label="AI Art Advisor">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-canvas-500/8 blur-3xl" aria-hidden="true" />
        <div className="container-art text-center relative">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-canvas-500 to-terracotta-500 flex items-center justify-center mx-auto mb-6 shadow-art-lg animate-float">
              <Sparkles className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-5 leading-tight">
              Not Sure Where<br />to Start?
            </h2>
            <p className="text-charcoal-300 text-lg mb-8 leading-relaxed max-w-lg mx-auto">
              Our AI art advisor asks a few simple questions about your preferences, budget, and lifestyle —
              then recommends the perfect medium just for you.
            </p>
            <Link to="/assistant" className="btn-primary btn-lg group inline-flex">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              Try the AI Advisor
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STUDIO FINDER CTA
      ════════════════════════════════════════════ */}
      <section className="section bg-cream" aria-label="Studio finder">
        <div className="container-art">
          <div className="rounded-3xl overflow-hidden relative min-h-80 flex items-center bg-charcoal-950 shadow-dark-lg">
            <img
              src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1400&q=80"
              alt="Art studio"
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950 via-charcoal-950/85 to-charcoal-950/10" aria-hidden="true" />
            <div className="relative z-10 p-10 md:p-14 max-w-xl">
              <p className="eyebrow-light mb-4">Near You</p>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4 leading-tight">
                Find Art Studios & Classes Near You
              </h2>
              <p className="text-charcoal-300 text-base mb-7 leading-relaxed">
                Discover pottery classes, painting workshops, and art studios in your city.
                Search by medium, location, or let us find what's nearby.
              </p>
              <Link to="/studios" className="btn-primary btn-lg group inline-flex">
                <MapPin className="w-5 h-5" aria-hidden="true" />
                Find Studios
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SUBSCRIPTION CTA
      ════════════════════════════════════════════ */}
      <section className="section relative overflow-hidden bg-gradient-to-br from-canvas-600 to-canvas-500" aria-label="Subscription plans">
        <div className="absolute inset-0 bg-hero-pattern opacity-15" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/8 blur-3xl" aria-hidden="true" />
        <div className="container-art text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-canvas-100 text-xs font-semibold uppercase tracking-wide mb-5">
            <Crown className="w-3.5 h-3.5" aria-hidden="true" />
            Premium
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-5 leading-tight">
            Unlock Everything
          </h2>
          <p className="text-canvas-100 text-lg mb-4 max-w-xl mx-auto leading-relaxed">
            Access live sessions, the full workshop library, all art mediums, and studio discounts.
          </p>

          {/* Key features */}
          <div className="flex flex-wrap justify-center gap-3 mb-9">
            {['Live Sessions', 'All Workshops', 'Studio Discounts', 'AI Advisor'].map(f => (
              <div key={f} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-sm">
                <Star className="w-3.5 h-3.5 text-canvas-200" fill="currentColor" aria-hidden="true" />
                {f}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/subscriptions"
              className="btn btn-lg bg-white text-canvas-700 hover:bg-canvas-50 shadow-lg font-semibold hover:-translate-y-0.5 hover:shadow-xl transition-all"
              aria-label="View subscription plans"
            >
              View Plans — from ₹299/mo
            </Link>
            <Link
              to="/live-sessions"
              className="btn-white-ghost btn-lg"
              aria-label="See live sessions"
            >
              <Play className="w-5 h-5" aria-hidden="true" /> Live Sessions
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
