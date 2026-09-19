import { useState } from 'react';
import { ArrowRight, ArrowLeft, Sparkles, Loader2, CheckCircle, MapPin, BookOpen, Play, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const QUESTIONS = [
  {
    id: 'experienceLevel',
    question: 'What is your current experience with art?',
    options: ['Complete beginner', 'Some experience', 'Intermediate', 'Advanced'],
  },
  {
    id: 'budget',
    question: 'What is your monthly budget for art supplies?',
    options: ['Under ₹500', '₹500 - ₹1500', '₹1500 - ₹3000', '₹3000+'],
  },
  {
    id: 'indoorOutdoor',
    question: 'Do you prefer working indoors or outdoors?',
    options: ['Strongly prefer indoors', 'Mostly indoors', 'Mostly outdoors', 'No preference'],
  },
  {
    id: 'messiness',
    question: 'How do you feel about messy mediums (clay, paint)?',
    options: ['Love it!', 'Fine with it', 'Prefer to stay clean', 'Definitely keep it clean'],
  },
  {
    id: 'challengeLevel',
    question: 'Do you want something relaxing or technically challenging?',
    options: ['Very relaxing', 'Somewhat relaxing', 'Balanced', 'Technically challenging'],
  },
  {
    id: 'learningStyle',
    question: 'How do you prefer to learn?',
    options: ['Alone at home', 'In-person classes', 'Online classes', 'Mix of both'],
  },
  {
    id: 'artInterest',
    question: 'What kind of art interests you most?',
    options: ['Painting & colour', 'Drawing & sketching', 'Sculpture & 3D', 'Mixed/not sure'],
  },
  {
    id: 'timeAvailable',
    question: 'How much time can you dedicate per week?',
    options: ['1-2 hours', '3-5 hours', '5-10 hours', '10+ hours'],
  },
  {
    id: 'traditionalDigital',
    question: 'Traditional art or digital art?',
    options: ['Definitely traditional', 'Leaning traditional', 'Leaning digital', 'Definitely digital'],
  },
];

const ProgressBar = ({ current, total }) => (
  <div className="flex items-center gap-3 mb-2">
    <div className="flex-1 h-1.5 bg-charcoal-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-canvas-500 to-terracotta-400 rounded-full transition-all duration-500"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
    <span className="text-xs text-charcoal-400 shrink-0">{current}/{total}</span>
  </div>
);

const ResultCard = ({ data }) => (
  <div className="max-w-2xl mx-auto animate-fade-up">
    {/* Main recommendation */}
    <div className="card p-6 mb-5 border-l-4 border-l-canvas-400">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-canvas-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-canvas-500" />
        </div>
        <div>
          <p className="text-xs text-canvas-500 uppercase tracking-widest font-medium mb-1">AI Recommendation</p>
          <h2 className="font-display font-bold text-2xl text-charcoal-900 mb-2">{data.medium}</h2>
          <p className="text-charcoal-600 leading-relaxed">{data.reason}</p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      {/* Budget */}
      {data.budget && (
        <div className="card p-4">
          <p className="text-xs text-charcoal-400 uppercase tracking-wider mb-1">Estimated Budget</p>
          <p className="font-display font-semibold text-charcoal-900">{data.budget}</p>
        </div>
      )}
      {/* Time */}
      {data.time_to_learn_basics && (
        <div className="card p-4">
          <p className="text-xs text-charcoal-400 uppercase tracking-wider mb-1">Time to Learn Basics</p>
          <p className="font-display font-semibold text-charcoal-900">{data.time_to_learn_basics}</p>
        </div>
      )}
    </div>

    {/* Supplies */}
    {data.supplies?.length > 0 && (
      <div className="card p-5 mb-4">
        <h3 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-sage-500" /> Starter Supplies
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.supplies.map((s, i) => <span key={i} className="tag">{s}</span>)}
        </div>
      </div>
    )}

    {/* Beginner tips */}
    {data.beginner_tips?.length > 0 && (
      <div className="card p-5 mb-4">
        <h3 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-canvas-500" /> Beginner Tips
        </h3>
        <ul className="space-y-2">
          {data.beginner_tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-charcoal-600">
              <div className="w-1.5 h-1.5 rounded-full bg-canvas-400 shrink-0 mt-2" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Resources from DB */}
    {data.resources?.length > 0 && (
      <div className="card p-5 mb-4">
        <h3 className="font-semibold text-charcoal-800 mb-3">Learning Resources</h3>
        <div className="space-y-2">
          {data.resources.slice(0, 4).map(r => (
            <a key={r._id} href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-50 hover:bg-canvas-50 transition-colors group">
              <BookOpen className="w-4 h-4 text-canvas-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-charcoal-700 group-hover:text-canvas-600 transition-colors">{r.title}</p>
                <p className="text-xs text-charcoal-400">{r.provider} · {r.isFree ? 'Free' : 'Paid'}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal-300 ml-auto shrink-0 group-hover:text-canvas-500 group-hover:translate-x-1 transition-all" />
            </a>
          ))}
        </div>
      </div>
    )}

    {/* Recorded sessions */}
    {data.recordedSessions?.length > 0 && (
      <div className="card p-5 mb-4">
        <h3 className="font-semibold text-charcoal-800 mb-3">Recommended Workshops</h3>
        <div className="space-y-2">
          {data.recordedSessions.map(s => (
            <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-50">
              <Play className="w-4 h-4 text-canvas-400 shrink-0" />
              <p className="text-sm font-medium text-charcoal-700">{s.title}</p>
              <span className="ml-auto badge badge-muted shrink-0">{s.requiredTier}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* CTAs */}
    <div className="flex flex-wrap gap-3">
      {data.mediumSlug && (
        <Link to={`/mediums/${data.mediumSlug}`} className="btn-primary flex-1 justify-center">
          <Sparkles className="w-4 h-4" /> Explore {data.medium}
        </Link>
      )}
      <Link to="/studios" className="btn-outline flex-1 justify-center">
        <MapPin className="w-4 h-4" /> Find Studios
      </Link>
    </div>
  </div>
);

const Assistant = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const current = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const hasAnswer = !!answers[current?.id];

  const selectOption = (option) => {
    setAnswers(a => ({ ...a, [current.id]: option }));
  };

  const next = async () => {
    if (isLast) {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post('/assistant/recommend', { answers });
        setResult(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-charcoal-950 to-charcoal-900">
      {/* Hero */}
      <div className="py-16 border-b border-charcoal-800">
        <div className="container-art text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-canvas-500 to-terracotta-500 flex items-center justify-center mx-auto mb-4 shadow-art-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-white mb-3">AI Art Advisor</h1>
          <p className="text-charcoal-300 text-lg max-w-md mx-auto">
            Answer 9 quick questions and get a personalised art medium recommendation powered by AI.
          </p>
        </div>
      </div>

      <div className="container-art py-12">
        {result ? (
          <div>
            <div className="flex items-center justify-between max-w-2xl mx-auto mb-6">
              <h2 className="font-display font-semibold text-white text-xl">Your Recommendation</h2>
              <button onClick={restart} className="btn border-2 border-charcoal-700 text-charcoal-300 hover:border-canvas-500 hover:text-canvas-400 transition-all btn-sm">
                <RefreshCw className="w-3.5 h-3.5" /> Start Over
              </button>
            </div>
            <ResultCard data={result} />
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full border-4 border-canvas-800 border-t-canvas-400 animate-spin mx-auto mb-4" />
            <p className="text-charcoal-300 text-lg font-medium">Crafting your personalised recommendation...</p>
            <p className="text-charcoal-500 text-sm mt-1">This usually takes 5–10 seconds</p>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <ProgressBar current={step + 1} total={QUESTIONS.length} />
            
            <div className="card p-8 mt-6 animate-fade-up">
              <p className="text-xs text-canvas-500 uppercase tracking-widest font-medium mb-3">
                Question {step + 1} of {QUESTIONS.length}
              </p>
              <h2 className="font-display font-semibold text-2xl text-charcoal-900 mb-6 leading-snug">
                {current.question}
              </h2>

              <div className="space-y-2.5 mb-8">
                {current.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => selectOption(opt)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${
                      answers[current.id] === opt
                        ? 'border-canvas-400 bg-canvas-50 text-canvas-700 shadow-art'
                        : 'border-charcoal-100 text-charcoal-700 hover:border-canvas-200 hover:bg-canvas-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        answers[current.id] === opt ? 'border-canvas-500 bg-canvas-500' : 'border-charcoal-300'
                      }`}>
                        {answers[current.id] === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {opt}
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">{error}</div>
              )}

              <div className="flex gap-2">
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)} className="btn-ghost">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <button
                  onClick={next}
                  disabled={!hasAnswer}
                  className="btn-primary flex-1 justify-center"
                >
                  {isLast ? (
                    <><Sparkles className="w-4 h-4" /> Get My Recommendation</>
                  ) : (
                    <>Next <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assistant;
