'use client';

import { useState, KeyboardEvent } from 'react';

interface ConfusionFlagProps {
  flags: string[];
  onChange: (flags: string[]) => void;
}

export default function ConfusionFlag({ flags, onChange }: ConfusionFlagProps) {
  const [input, setInput] = useState('');

  function addFlag() {
    const trimmed = input.trim();
    if (!trimmed || flags.includes(trimmed)) return;
    onChange([...flags, trimmed]);
    setInput('');
  }

  function removeFlag(index: number) {
    onChange(flags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFlag();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a confusion flag (e.g. client name matches channel name)"
          className="flex-1 px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
        />
        <button
          type="button"
          onClick={addFlag}
          className="px-3 py-2 text-sm font-medium border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Add
        </button>
      </div>
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {flags.map((flag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full text-xs text-amber-800 dark:text-amber-200"
            >
              <span className="max-w-xs truncate" title={flag}>{flag}</span>
              <button
                type="button"
                onClick={() => removeFlag(i)}
                className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 leading-none"
                aria-label={`Remove flag: ${flag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
