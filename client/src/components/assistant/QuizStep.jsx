import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import QuizOption from './QuizOption';

const QuizStep = ({
  stepIndex,
  totalSteps,
  questionData,
  selectedAnswer,
  onSelectAnswer,
  onNext,
  onPrev,
  isSubmitting,
  onJumpToStep,
  completedSteps = [],
}) => {
  const { id, title, category, description, icon: CategoryIcon, options } = questionData;
  const isLastStep = stepIndex === totalSteps - 1;
  const hasSelected = !!selectedAnswer;

  // Keyboard shortcut listener (1-9 or Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Numbers 1-9 to select options
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= options.length) {
        const opt = options[num - 1];
        const label = typeof opt === 'string' ? opt : opt.label;
        onSelectAnswer(label);
      }
      // Enter to go next if answer selected
      if (e.key === 'Enter' && hasSelected && !isSubmitting) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, hasSelected, isSubmitting, onNext, onSelectAnswer]);

  return (
    <div className="max-w-2xl mx-auto w-full animate-fade-up">
      {/* Step Header & Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-canvas-500/10 text-canvas-400 border border-canvas-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Progress: Step {stepIndex + 1} of {totalSteps}
            </span>
            {category && (
              <span className="text-xs uppercase tracking-wider text-charcoal-400 font-medium hidden sm:inline-block">
                • {category}
              </span>
            )}
          </div>
          <span className="text-xs text-charcoal-400 font-mono">
            {Math.round(((stepIndex + 1) / totalSteps) * 100)}% Completed
          </span>
        </div>

        {/* Glowing Progress Bar */}
        <div className="h-2 w-full bg-charcoal-800 rounded-full overflow-hidden p-0.5 border border-charcoal-700/50">
          <div
            className="h-full bg-gradient-to-r from-canvas-500 via-amber-400 to-terracotta-400 rounded-full transition-all duration-500 ease-out shadow-sm shadow-canvas-500/50"
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-charcoal-900/80 backdrop-blur-xl border border-charcoal-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-canvas-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Question Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3.5">
            {CategoryIcon && (
              <div className="w-10 h-10 rounded-xl bg-canvas-500/15 border border-canvas-500/30 flex items-center justify-center text-canvas-400 shrink-0 mt-0.5">
                <CategoryIcon className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {title}
              </h2>
              {description && (
                <p className="text-charcoal-400 text-sm mt-1.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-3 mb-8">
          {options.map((opt, idx) => {
            const label = typeof opt === 'string' ? opt : opt.label;
            const isSelected = selectedAnswer === label;
            return (
              <QuizOption
                key={label || idx}
                option={opt}
                index={idx}
                isSelected={isSelected}
                onSelect={onSelectAnswer}
              />
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-charcoal-800/80">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={onPrev}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-charcoal-300 hover:text-white hover:bg-charcoal-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <span className="text-xs text-charcoal-500 hidden sm:inline-block">
              Press <kbd className="px-1.5 py-0.5 bg-charcoal-800 rounded border border-charcoal-700 text-[10px] text-charcoal-300 font-mono">1-{options.length}</kbd> or <kbd className="px-1.5 py-0.5 bg-charcoal-800 rounded border border-charcoal-700 text-[10px] text-charcoal-300 font-mono">Enter ↵</kbd>
            </span>

            <button
              type="button"
              onClick={onNext}
              disabled={!hasSelected || isSubmitting}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                hasSelected && !isSubmitting
                  ? 'bg-gradient-to-r from-canvas-500 to-amber-500 text-charcoal-950 hover:brightness-110 shadow-lg shadow-canvas-500/20 active:scale-98'
                  : 'bg-charcoal-800 text-charcoal-500 cursor-not-allowed border border-charcoal-700/50'
              }`}
            >
              {isLastStep ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Get Recommendation
                </>
              ) : (
                <>
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step Dots indicator */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const isCurrent = idx === stepIndex;
          const isPassed = completedSteps.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => (isPassed || isCurrent) && onJumpToStep && onJumpToStep(idx)}
              title={`Step ${idx + 1}`}
              disabled={!isPassed && !isCurrent}
              aria-label={`Go to Step ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                isCurrent
                  ? 'w-8 bg-canvas-500 shadow-sm shadow-canvas-500/50'
                  : isPassed
                  ? 'w-2 bg-canvas-500/50 hover:bg-canvas-500/80 cursor-pointer'
                  : 'w-2 bg-charcoal-800 cursor-default'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default QuizStep;
