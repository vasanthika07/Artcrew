import React from 'react';
import { Check } from 'lucide-react';

const QuizOption = ({
  option,
  index,
  isSelected,
  onSelect,
}) => {
  const { label, description, icon: Icon, badge } = typeof option === 'string'
    ? { label: option, description: '', icon: null, badge: null }
    : option;

  return (
    <button
      type="button"
      onClick={() => onSelect(label)}
      className={`group relative w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center gap-4 ${
        isSelected
          ? 'border-canvas-500 bg-gradient-to-r from-canvas-500/10 via-canvas-500/5 to-transparent shadow-lg shadow-canvas-500/10 ring-1 ring-canvas-500/30'
          : 'border-charcoal-800 bg-charcoal-900/60 hover:border-charcoal-700 hover:bg-charcoal-800/60 hover:shadow-md'
      }`}
    >
      {/* Shortcut Number Badge */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-medium text-sm transition-colors duration-200 ${
          isSelected
            ? 'bg-canvas-500 text-charcoal-950 font-bold'
            : 'bg-charcoal-800 text-charcoal-400 group-hover:bg-charcoal-700 group-hover:text-charcoal-200'
        }`}
      >
        {Icon ? <Icon className="w-5 h-5" /> : index + 1}
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`font-semibold text-base transition-colors ${
              isSelected ? 'text-canvas-300' : 'text-white group-hover:text-canvas-200'
            }`}
          >
            {label}
          </span>
          {badge && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-canvas-500/20 text-canvas-400 border border-canvas-500/30">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs md:text-sm text-charcoal-400 group-hover:text-charcoal-300 transition-colors line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Radio Circle / Checkmark */}
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
          isSelected
            ? 'border-canvas-500 bg-canvas-500 text-charcoal-950 scale-105'
            : 'border-charcoal-600 bg-charcoal-950/50 group-hover:border-charcoal-400'
        }`}
      >
        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </div>
    </button>
  );
};

export default QuizOption;
