'use client';

import { useState } from 'react';

type SectionKey = 'tldr' | 'insights' | 'analyst_qs' | 'content_qs';

interface OutputPanelProps {
  results: Partial<Record<SectionKey, string>>;
  loading: Partial<Record<SectionKey, boolean>>;
  confusionFlags: string[];
  outputType: string;
}

const TABS: { key: SectionKey; label: string; loadingLabel: string }[] = [
  { key: 'tldr', label: 'TL;DR', loadingLabel: 'Writing TL;DR...' },
  { key: 'insights', label: 'Insights', loadingLabel: 'Writing Insights...' },
  { key: 'analyst_qs', label: 'Analyst questions', loadingLabel: 'Writing Analyst questions...' },
  { key: 'content_qs', label: 'Content team questions', loadingLabel: 'Writing Content team questions...' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={copy}
      className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1 transition-colors"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function SectionBlock({ text, isLoading, loadingLabel }: { text?: string; isLoading: boolean; loadingLabel: string }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-neutral-400">
        <span className="inline-block w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-pulse" />
        {loadingLabel}
      </div>
    );
  }
  if (!text) return null;
  return (
    <div className="relative group">
      <div className="absolute top-0 right-0">
        <CopyButton text={text} />
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 pt-1 pr-16">
        {text}
      </pre>
    </div>
  );
}

export default function OutputPanel({ results, loading, confusionFlags, outputType }: OutputPanelProps) {
  const visibleTabs =
    outputType === 'all'
      ? TABS
      : TABS.filter((t) => t.key === outputType);

  const [activeTab, setActiveTab] = useState<SectionKey>(visibleTabs[0]?.key ?? 'tldr');

  const hasAnyContent = Object.values(results).some(Boolean);
  const isAnyLoading = Object.values(loading).some(Boolean);

  if (!hasAnyContent && !isAnyLoading) return null;

  const allText = TABS.filter((t) => results[t.key])
    .map((t) => `## ${t.label}\n\n${results[t.key]}`)
    .join('\n\n---\n\n');

  return (
    <div className="space-y-4">
      {confusionFlags.length > 0 && (
        <div className="space-y-2">
          {confusionFlags.map((flag, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-xs text-amber-800 dark:text-amber-200"
            >
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{flag}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 px-4 bg-neutral-50 dark:bg-neutral-900">
          <div className="flex gap-0 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                } ${loading[tab.key] ? 'opacity-70' : ''}`}
              >
                {tab.label}
                {loading[tab.key] && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>
          {allText && (
            <div className="pl-2 shrink-0">
              <CopyButton text={allText} />
            </div>
          )}
        </div>

        <div className="p-5 min-h-[200px]">
          {visibleTabs.map((tab) => (
            <div key={tab.key} className={activeTab === tab.key ? 'block' : 'hidden'}>
              <SectionBlock
                text={results[tab.key]}
                isLoading={!!loading[tab.key]}
                loadingLabel={tab.loadingLabel}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
