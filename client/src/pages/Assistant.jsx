import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Palette,
  DollarSign,
  Compass,
  Smile,
  Zap,
  Users,
  Feather,
  Layers,
  Clock,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../api/axios';
import { toast } from '../components/Toast';
import QuizStep from '../components/assistant/QuizStep';
import RecommendationResult from '../components/assistant/RecommendationResult';

const QUESTIONS = [
  {
    id: 'experienceLevel',
    category: 'Background',
    icon: Palette,
    title: 'What is your experience level with making art?',
    description: 'We will tailor technique complexity and beginner supplies to your familiarity.',
    options: [
      {
        label: 'Complete Beginner',
        description: 'Never picked up a brush or pencil, excited to explore from scratch',
        badge: 'Popular',
      },
      {
        label: 'Casual Dabbler',
        description: 'Doodled or done occasional craft projects in school or leisure',
      },
      {
        label: 'Some Experience',
        description: 'Familiar with basic drawing/painting and eager to build deeper skill',
      },
      {
        label: 'Practiced / Advanced',
        description: 'Experienced artist seeking to branch into a fresh, rewarding medium',
      },
    ],
  },
  {
    id: 'budget',
    category: 'Investment',
    icon: DollarSign,
    title: 'What is your comfortable starting budget?',
    description: 'Art is for everyone — we have recommendations for all price ranges.',
    options: [
      {
        label: 'Under ₹500',
        description: 'Low-cost, minimalist essentials to get started immediately',
      },
      {
        label: '₹500 – ₹1,500',
        description: 'Curated starter kit with dependable everyday materials',
        badge: 'Recommended',
      },
      {
        label: '₹1,500 – ₹3,500',
        description: 'Quality student-grade supplies with versatile brushes and paper/canvas',
      },
      {
        label: '₹3,500+ / Flexible',
        description: 'Premium artist materials, studio gear, or in-person workshop setup',
      },
    ],
  },
  {
    id: 'environment',
    category: 'Workspace',
    icon: Compass,
    title: 'Where do you envision yourself creating art?',
    description: 'Different mediums suit different spaces and ventilation needs.',
    options: [
      {
        label: 'Cozy at Home',
        description: 'Desk, kitchen table, or a small creative corner at home',
      },
      {
        label: 'Dedicated Art Studio',
        description: 'Community studios with wheels, easels, and kiln access',
      },
      {
        label: 'Outdoors & Nature',
        description: 'Plein air painting in parks, mountains, travel, or terraces',
      },
      {
        label: 'Flexible / Anywhere',
        description: 'Portable setup that easily packs into a bag on the go',
      },
    ],
  },
  {
    id: 'messiness',
    category: 'Tactile Preference',
    icon: Smile,
    title: 'How do you feel about clean vs messy mediums?',
    description: 'From clean precision pencils to hands-on clay throwing and paint splatters.',
    options: [
      {
        label: 'Keep it clean & tidy',
        description: 'Minimal cleanup, low residue, pens, pencils, or dry mediums',
      },
      {
        label: 'A little mess is fine',
        description: 'Watercolours or acrylics with quick water-soluble cleanup',
        badge: 'Balanced',
      },
      {
        label: 'Embrace the mess!',
        description: 'Love getting hands dirty with clay, charcoal, or heavy texture pastes',
      },
      {
        label: 'No preference',
        description: 'Happy with any process as long as the art looks inspiring',
      },
    ],
  },
  {
    id: 'challengeLevel',
    category: 'Mindset',
    icon: Zap,
    title: 'What vibe are you seeking from your creative sessions?',
    description: 'Tell us whether you want mindful relaxation or rigorous technical growth.',
    options: [
      {
        label: 'Meditative & Relaxing',
        description: 'De-stress, unwind, and enjoy a calming, pressure-free flow state',
      },
      {
        label: 'Gentle Creative Flow',
        description: 'Fun, spontaneous expression with quick, satisfying results',
      },
      {
        label: 'Balanced Learning Curve',
        description: 'A satisfying blend of creative freedom and structured technique',
        badge: 'Most Chosen',
      },
      {
        label: 'Technically Challenging',
        description: 'Deep mastery of proportions, light, anatomy, and fine precision',
      },
    ],
  },
  {
    id: 'learningStyle',
    category: 'Learning Mode',
    icon: Users,
    title: 'Do you prefer learning solo or in a group class?',
    description: 'We will match you with self-guided tutorials or local studio workshops.',
    options: [
      {
        label: 'Solo Self-Paced',
        description: 'Quiet focus alone at home with video guides and reference books',
      },
      {
        label: 'In-Person Studio Classes',
        description: 'Hands-on guidance with resident artists and tactile equipment',
      },
      {
        label: 'Online Interactive Cohorts',
        description: 'Virtual live sessions and community critiques from your room',
      },
      {
        label: 'Mix of Both',
        description: 'Solo practice balanced with weekend workshops and masterclasses',
      },
    ],
  },
  {
    id: 'traditionalDigital',
    category: 'Medium Format',
    icon: Feather,
    title: 'Traditional hands-on media or digital tools?',
    description: 'Physical tactile surfaces vs modern digital screens and styluses.',
    options: [
      {
        label: 'Traditional Hands-on',
        description: 'Physical paints, paper, clay, charcoal sticks, and textures',
        badge: 'Core Focus',
      },
      {
        label: 'Mostly Traditional',
        description: 'Physical materials with digital reference photos & color pickers',
      },
      {
        label: 'Hybrid / Curious about Both',
        description: 'Interested in exploring both traditional physical art and digital tools',
      },
      {
        label: 'Fully Digital',
        description: 'Tablet, stylus, Procreate, Photoshop, or digital illustration tools',
      },
    ],
  },
  {
    id: 'artInterests',
    category: 'Subject Matter',
    icon: Layers,
    title: 'What kind of art subjects excite you most?',
    description: 'We will match you with the medium best suited for your favorite subjects.',
    options: [
      {
        label: 'Landscapes & Nature',
        description: 'Sunsets, ocean horizons, botanical studies, and open skies',
      },
      {
        label: 'Portraits & Human Faces',
        description: 'Expressive eyes, facial features, proportions, and emotion',
      },
      {
        label: 'Vibrant Colors & Abstract',
        description: 'Expressive bold brushwork, fluid movement, and modern aesthetics',
      },
      {
        label: 'Pottery & 3D Tactile Objects',
        description: 'Ceramic bowls, terracotta vessels, sculptured hand-built clay',
      },
      {
        label: 'Dramatic Sketching & Charcoal',
        description: 'Monochrome contrast, expressive shading, lighting, and anatomy',
      },
    ],
  },
  {
    id: 'timeAvailable',
    category: 'Commitment',
    icon: Clock,
    title: 'How much time can you dedicate per week?',
    description: 'Some mediums require setup and drying time; others are instant.',
    options: [
      {
        label: '< 1 Hour / week',
        description: 'Quick 10-15 minute daily sketches or weekend doodles',
      },
      {
        label: '1 – 3 Hours / week',
        description: 'A relaxed weekend painting session or two weekday evenings',
      },
      {
        label: '3 – 6 Hours / week',
        description: 'Steady, regular weekly practice to build confident technique',
        badge: 'Ideal Pace',
      },
      {
        label: '7+ Hours / week',
        description: 'Deep immersion, masterclasses, and dedicated daily studio practice',
      },
    ],
  },
];

const LOADING_TIPS = [
  'Consulting ArtCrew recommendation algorithms...',
  'Analyzing your messiness and budget preferences...',
  'Curating verified starter supplies and budget estimates...',
  'Locating top-rated nearby studio workshops...',
  'Filtering beginner learning resources and recorded sessions...',
];

const Assistant = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTipIdx, setLoadingTipIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  // Attempt silent geolocation on mount to enhance studio recommendations
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          // Geolocation declined or unavailable — handled gracefully
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  // Cycle loading tips during AI call
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingTipIdx((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const currentQuestion = QUESTIONS[step];
  const currentAnswer = answers[currentQuestion?.id] || '';

  const handleSelectAnswer = (optionLabel) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionLabel,
    }));
  };

  const handleNext = async () => {
    // Record step completion
    if (!completedSteps.includes(step)) {
      setCompletedSteps((prev) => [...prev, step]);
    }

    // If final step, submit to backend
    if (step === QUESTIONS.length - 1) {
      setLoading(true);
      setError(null);

      try {
        const payload = {
          answers,
          ...(location?.latitude ? { latitude: location.latitude, longitude: location.longitude } : {}),
        };

        const response = await api.post('/assistant/recommend', payload);
        if (response.data && response.data.success && response.data.data) {
          setResult(response.data.data);
          toast.success('Your personalized art recommendation is ready!');
        } else {
          throw new Error(response.data?.message || 'Invalid recommendation response');
        }
      } catch (err) {
        console.error('Recommendation API error:', err);
        const errMsg =
          err.response?.data?.message ||
          'Failed to generate recommendation. Please check your connection and try again.';
        setError(errMsg);
        toast.error(errMsg);
      } finally {
        setLoading(false);
      }
    } else {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToStep = (targetIndex) => {
    if (targetIndex >= 0 && targetIndex < QUESTIONS.length) {
      setStep(targetIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRetake = () => {
    setStep(0);
    setAnswers({});
    setCompletedSteps([]);
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-white relative selection:bg-canvas-500 selection:text-charcoal-950">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-canvas-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-terracotta-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Banner */}
      {!result && (
        <header className="py-10 border-b border-charcoal-800/80 bg-charcoal-900/40 backdrop-blur-md">
          <div className="container-art text-center max-w-3xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-canvas-500/10 border border-canvas-500/20 text-canvas-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              AI Art Recommendation Engine
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight mb-3">
              Find Your Ideal Art Medium
            </h1>
            <p className="text-charcoal-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Answer 9 thoughtful questions about your style, space, and goals. We'll match you with the perfect medium, starter kit, resources, and local studios.
            </p>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="container-art py-8 sm:py-12 px-4">
        {loading ? (
          /* Loading State */
          <div className="max-w-md mx-auto text-center py-16 px-6 rounded-3xl bg-charcoal-900/60 border border-charcoal-800 backdrop-blur-xl animate-fade-in shadow-2xl">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-charcoal-800 border-t-canvas-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-canvas-400">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>
            </div>

            <h2 className="font-display font-semibold text-xl text-white mb-2">
              Curating Your Art Profile
            </h2>
            <p className="text-canvas-400 text-sm font-medium min-h-[40px] transition-all duration-300">
              {LOADING_TIPS[loadingTipIdx]}
            </p>
            <p className="text-xs text-charcoal-500 mt-4 font-mono">
              Powered by Anthropic & ArtCrew Intelligence
            </p>
          </div>
        ) : error && !result ? (
          /* Error State with Retry */
          <div className="max-w-lg mx-auto text-center py-12 px-6 rounded-3xl bg-red-950/20 border border-red-800/40 animate-fade-up">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="font-display font-bold text-xl text-white mb-2">
              Recommendation Failed
            </h2>
            <p className="text-charcoal-300 text-sm mb-6 leading-relaxed">
              {error}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-canvas-500 text-charcoal-950 font-semibold text-sm hover:brightness-110 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              <button
                type="button"
                onClick={handleRetake}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-charcoal-800 text-charcoal-200 text-sm hover:bg-charcoal-700 cursor-pointer"
              >
                Restart Quiz
              </button>
            </div>
          </div>
        ) : result ? (
          /* Recommendation Result */
          <RecommendationResult data={result} onRetake={handleRetake} />
        ) : (
          /* Quiz Step Display */
          <QuizStep
            stepIndex={step}
            totalSteps={QUESTIONS.length}
            questionData={currentQuestion}
            selectedAnswer={currentAnswer}
            onSelectAnswer={handleSelectAnswer}
            onNext={handleNext}
            onPrev={handlePrev}
            isSubmitting={loading}
            onJumpToStep={handleJumpToStep}
            completedSteps={completedSteps}
          />
        )}
      </main>
    </div>
  );
};

export default Assistant;
