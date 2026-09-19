import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  MapPin,
  BookOpen,
  Play,
  CheckCircle2,
  DollarSign,
  Compass,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Star,
  Layers,
  Award,
  Clock,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import { toast } from '../Toast';

const RESOURCE_ICONS = {
  guide: BookOpen,
  video: Play,
  course: Award,
  community: Compass,
  'supply-list': Layers,
  tips: Sparkles,
};

const RecommendationResult = ({ data, onRetake }) => {
  const [copiedSupplies, setCopiedSupplies] = useState(false);
  const [checkedSupplies, setCheckedSupplies] = useState({});

  if (!data) return null;

  const {
    medium,
    mediumId,
    mediumSlug,
    coverImage,
    difficulty = 'Beginner',
    reason,
    budget,
    supplies = [],
    studios = [],
    resources = [],
    recordedSessions = [],
  } = data;

  // Toggle checklist item
  const toggleSupply = (idx) => {
    setCheckedSupplies((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Copy supplies to clipboard
  const handleCopySupplies = () => {
    if (!supplies.length) return;
    const text = `ArtCrew Beginner Supplies for ${medium}:\n` + supplies.map((s) => `• ${s}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSupplies(true);
      toast.success('Supplies list copied to clipboard!');
      setTimeout(() => setCopiedSupplies(false), 2500);
    });
  };

  // Smooth scroll to learning resources section
  const handleStartLearning = () => {
    const el = document.getElementById('learning-resources-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (resources.length > 0 && resources[0].url) {
      window.open(resources[0].url, '_blank');
    }
  };

  // Split sessions into standard and premium
  const premiumSessions = recordedSessions.filter(
    (s) => s.requiredTier === 'pro' || s.requiredTier === 'studio'
  );
  const beginnerVideos = recordedSessions.filter((s) => s.requiredTier === 'basic');

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-up pb-12">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-charcoal-900/80 border border-charcoal-800 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-canvas-400 uppercase tracking-widest">
          <Sparkles className="w-4 h-4 text-canvas-400 animate-pulse" />
          AI Tailored Recommendation
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRetake}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-charcoal-700 text-xs font-medium text-charcoal-300 hover:text-white hover:border-canvas-500 transition-all cursor-pointer w-full sm:w-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retake Quiz
          </button>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="relative rounded-3xl overflow-hidden border border-charcoal-800 bg-gradient-to-b from-charcoal-900 via-charcoal-950 to-charcoal-950 shadow-2xl">
        {/* Cover Background Accent */}
        {coverImage && (
          <div className="absolute inset-0 opacity-20 mix-blend-luminosity overflow-hidden pointer-events-none">
            <img
              src={coverImage}
              alt={medium}
              className="w-full h-full object-cover filter blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/80 to-transparent" />
          </div>
        )}

        <div className="relative p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="badge badge-success px-3 py-1 text-xs">
              {difficulty} Friendly
            </span>
            {budget && (
              <span className="badge badge-warning px-3 py-1 text-xs flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Est. {budget}
              </span>
            )}
            <span className="text-xs text-charcoal-400 font-mono ml-auto">
              100% Match
            </span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest text-canvas-400 mb-1">
            Recommended Medium
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight mb-6">
            {medium}
          </h1>

          {/* Why it fits you */}
          <div className="p-5 sm:p-6 rounded-2xl bg-canvas-500/10 border border-canvas-500/25 relative">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-canvas-500/20 text-canvas-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xs uppercase font-bold tracking-wider text-canvas-300">
                  Why It Fits You
                </h2>
                <p className="text-charcoal-200 text-sm sm:text-base leading-relaxed">
                  {reason}
                </p>
              </div>
            </div>
          </div>

          {/* Core Action CTAs inside Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
            <Link
              to={mediumSlug ? `/mediums/${mediumSlug}` : mediumId ? `/mediums/${mediumId}` : '/mediums'}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-canvas-500 to-amber-500 text-charcoal-950 font-semibold text-sm hover:brightness-110 shadow-lg shadow-canvas-500/20 transition-all cursor-pointer"
            >
              <Palette className="w-4 h-4" />
              Explore This Medium
            </Link>

            <Link
              to={`/studios?medium=${encodeURIComponent(medium)}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-charcoal-800/90 hover:bg-charcoal-700 text-white font-medium text-sm border border-charcoal-700 transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-terracotta-400" />
              Find Nearby Classes
            </Link>

            <button
              type="button"
              onClick={handleStartLearning}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-charcoal-800/90 hover:bg-charcoal-700 text-white font-medium text-sm border border-charcoal-700 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-canvas-400" />
              Start Learning
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Budget & Supplies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estimated Starting Budget */}
        <div className="p-6 rounded-3xl bg-charcoal-900/70 border border-charcoal-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-white">
                Estimated Starting Budget
              </h2>
              <p className="text-xs text-charcoal-400">
                Affordable starter investment
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-charcoal-950/60 border border-charcoal-800/80">
            <span className="text-xs text-charcoal-400 uppercase tracking-wider block mb-1">
              Estimated Initial Cost
            </span>
            <p className="text-2xl font-bold font-display text-amber-300">
              {budget || '₹1,500 - ₹3,000'}
            </p>
          </div>

          <p className="text-xs text-charcoal-400 leading-relaxed">
            💡 <strong>Pro-tip:</strong> You do not need expensive professional-grade materials to start. A compact starter kit allows you to master techniques before upgrading your supplies.
          </p>
        </div>

        {/* Beginner Supplies */}
        <div className="p-6 rounded-3xl bg-charcoal-900/70 border border-charcoal-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-canvas-500/15 border border-canvas-500/30 flex items-center justify-center text-canvas-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-white">
                  Beginner Supplies
                </h2>
                <p className="text-xs text-charcoal-400">
                  Essential tools checklist
                </p>
              </div>
            </div>

            {supplies.length > 0 && (
              <button
                type="button"
                onClick={handleCopySupplies}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-charcoal-300 hover:text-canvas-300 bg-charcoal-800 hover:bg-charcoal-700 transition-colors cursor-pointer"
              >
                {copiedSupplies ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy List
                  </>
                )}
              </button>
            )}
          </div>

          {supplies.length > 0 ? (
            <div className="space-y-2">
              {supplies.map((item, idx) => {
                const isChecked = !!checkedSupplies[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleSupply(idx)}
                    className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl border transition-all text-xs sm:text-sm cursor-pointer ${
                      isChecked
                        ? 'bg-canvas-500/10 border-canvas-500/30 text-charcoal-400 line-through'
                        : 'bg-charcoal-950/50 border-charcoal-800/80 text-charcoal-200 hover:border-charcoal-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        isChecked
                          ? 'border-canvas-500 bg-canvas-500 text-charcoal-950'
                          : 'border-charcoal-600'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="flex-1">{item}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-charcoal-400">Starter supplies list loading...</p>
          )}
        </div>
      </div>

      {/* Nearby Studios Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-charcoal-900/70 border border-charcoal-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta-500/15 border border-terracotta-500/30 flex items-center justify-center text-terracotta-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-xl text-white">
                Nearby Art Studios & Classes
              </h2>
              <p className="text-xs text-charcoal-400">
                Connect with local spaces offering {medium} workshops
              </p>
            </div>
          </div>

          <Link
            to={`/studios?medium=${encodeURIComponent(medium)}`}
            className="text-xs font-semibold text-canvas-400 hover:text-canvas-300 inline-flex items-center gap-1"
          >
            Find Nearby Classes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {studios.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {studios.map((studio) => (
              <div
                key={studio.id || studio._id}
                className="p-4 rounded-2xl bg-charcoal-950/60 border border-charcoal-800/80 flex flex-col justify-between hover:border-canvas-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-sm line-clamp-1">
                      {studio.name}
                    </h3>
                    {studio.rating && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-md shrink-0">
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        {studio.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-charcoal-400 line-clamp-2 mb-3">
                    {studio.address || 'Local studio'}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-charcoal-800/60">
                  {studio.distance !== null && studio.distance !== undefined ? (
                    <span className="text-[11px] text-charcoal-400 font-mono">
                      {studio.distance.toFixed(1)} km away
                    </span>
                  ) : (
                    <span className="text-[11px] text-canvas-400/80">Studio Partner</span>
                  )}

                  <Link
                    to={`/studios?medium=${encodeURIComponent(medium)}&keyword=${encodeURIComponent(studio.name)}`}
                    className="text-xs font-medium text-canvas-400 hover:text-canvas-300 inline-flex items-center gap-1"
                  >
                    View Class <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-charcoal-950/40 border border-dashed border-charcoal-800 text-center space-y-3">
            <p className="text-sm text-charcoal-300">
              Discover verified studios and community workshops offering {medium} courses.
            </p>
            <Link
              to={`/studios?medium=${encodeURIComponent(medium)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal-800 text-xs font-semibold text-white hover:bg-charcoal-700 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-terracotta-400" />
              Find Classes in Your City
            </Link>
          </div>
        )}
      </div>

      {/* Learning Resources Section */}
      <div id="learning-resources-section" className="p-6 sm:p-8 rounded-3xl bg-charcoal-900/70 border border-charcoal-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-canvas-500/15 border border-canvas-500/30 flex items-center justify-center text-canvas-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-xl text-white">
              Curated Learning Resources
            </h2>
            <p className="text-xs text-charcoal-400">
              Database verified guides, tutorials, and community hubs
            </p>
          </div>
        </div>

        {resources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {resources.map((res) => {
              const ResIcon = RESOURCE_ICONS[res.resourceType] || BookOpen;
              return (
                <a
                  key={res._id}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-4 rounded-2xl bg-charcoal-950/60 border border-charcoal-800/80 hover:border-canvas-500/50 hover:bg-charcoal-900/90 transition-all flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-charcoal-800 group-hover:bg-canvas-500 group-hover:text-charcoal-950 text-canvas-400 flex items-center justify-center shrink-0 transition-colors">
                    <ResIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white group-hover:text-canvas-300 transition-colors line-clamp-1">
                        {res.title}
                      </span>
                      {res.isFree ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-green-500/20 text-green-400 border border-green-500/30 shrink-0">
                          FREE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                          PRO
                        </span>
                      )}
                    </div>
                    {res.description && (
                      <p className="text-xs text-charcoal-400 line-clamp-2 mb-2">
                        {res.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-charcoal-500">
                      <span>{res.provider || 'ArtCrew Resource'}</span>
                      <span>•</span>
                      <span className="capitalize">{res.level || 'Beginner'}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-charcoal-500 group-hover:text-canvas-400 shrink-0 transition-colors" />
                </a>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-charcoal-400">Learning resources loading...</p>
        )}
      </div>

      {/* Recommended Videos & Premium Sessions */}
      {(beginnerVideos.length > 0 || premiumSessions.length > 0) && (
        <div className="p-6 sm:p-8 rounded-3xl bg-charcoal-900/70 border border-charcoal-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-xl text-white">
                Recommended Videos & Premium Workshops
              </h2>
              <p className="text-xs text-charcoal-400">
                Step-by-step masterclasses led by resident artists
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordedSessions.map((session) => (
              <div
                key={session._id}
                className="group rounded-2xl bg-charcoal-950/60 border border-charcoal-800/80 overflow-hidden hover:border-canvas-500/40 transition-all flex flex-col justify-between"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-charcoal-900 overflow-hidden">
                  <img
                    src={
                      session.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1579762593217-7b5d5d8e0a89?w=600'
                    }
                    alt={session.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        session.requiredTier === 'basic'
                          ? 'bg-green-500/80 text-white'
                          : session.requiredTier === 'pro'
                          ? 'bg-canvas-500 text-charcoal-950'
                          : 'bg-purple-500 text-white'
                      }`}
                    >
                      {session.requiredTier === 'basic' ? 'Free / Basic' : `${session.requiredTier} Tier`}
                    </span>
                    {session.durationSeconds ? (
                      <span className="text-[10px] font-mono text-white/90 bg-charcoal-950/80 px-1.5 py-0.5 rounded">
                        {Math.round(session.durationSeconds / 60)} min
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm group-hover:text-canvas-300 transition-colors line-clamp-1 mb-1">
                      {session.title}
                    </h3>
                    <p className="text-xs text-charcoal-400 line-clamp-2 mb-3">
                      {session.description || 'Guided art masterclass'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-charcoal-800/60 text-xs">
                    <span className="text-charcoal-400">
                      {session.instructor ? `By ${session.instructor}` : 'ArtCrew Masterclass'}
                    </span>
                    <Link
                      to="/recorded-sessions"
                      className="font-semibold text-canvas-400 hover:text-canvas-300 inline-flex items-center gap-1"
                    >
                      Watch <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-charcoal-900/95 backdrop-blur-xl border border-charcoal-700/80 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-canvas-500/20 text-canvas-400 flex items-center justify-center font-bold text-xs">
            ✨
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              Ready to create in {medium}?
            </p>
            <p className="text-[11px] text-charcoal-400">
              Explore tutorials, locate studios, and get hands-on
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={mediumSlug ? `/mediums/${mediumSlug}` : '/mediums'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-canvas-500 text-charcoal-950 font-semibold text-xs hover:brightness-110 shadow-md transition-all"
          >
            Explore This Medium
          </Link>

          <Link
            to={`/studios?medium=${encodeURIComponent(medium)}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-white font-medium text-xs border border-charcoal-700 transition-all"
          >
            Find Nearby Classes
          </Link>

          <button
            type="button"
            onClick={handleStartLearning}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-white font-medium text-xs border border-charcoal-700 transition-all"
          >
            Start Learning
          </button>

          <button
            type="button"
            onClick={onRetake}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-charcoal-400 hover:text-white text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationResult;
