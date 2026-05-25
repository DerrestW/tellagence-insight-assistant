'use client';

import { useState } from 'react';
import Image from 'next/image';
import InsightForm from '@/components/InsightForm';
import OutputPanel from '@/components/OutputPanel';
import { GenerateInput } from '@/app/api/generate/route';

type SectionKey = 'tldr' | 'insights' | 'analyst_qs' | 'content_qs';

export default function Home() {
  const [results, setResults] = useState<Partial<Record<SectionKey, string>>>({});
  const [loading, setLoading] = useState<Partial<Record<SectionKey, boolean>>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastInput, setLastInput] = useState<GenerateInput | null>(null);

  async function handleSubmit(input: GenerateInput) {
    setError(null);
    setResults({});
    setLastInput(input);
    setIsLoading(true);

    const sections: SectionKey[] =
      input.outputType === 'all'
        ? ['tldr', 'insights', 'analyst_qs', 'content_qs']
        : [input.outputType as SectionKey];

    const initialLoading = Object.fromEntries(sections.map((s) => [s, true])) as Partial<Record<SectionKey, boolean>>;
    setLoading(initialLoading);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
      setLoading({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading({});
    } finally {
      setIsLoading(false);
    }
  }

  const activeFlags = lastInput
    ? (() => {
        const flags = [...lastInput.confusionFlags];
        const channels = lastInput.channels.split(',').map((c) => c.trim()).filter(Boolean);
        const collision = channels.find((c) =>
          c.toLowerCase().includes(lastInput.clientName.toLowerCase())
        );
        if (collision) {
          flags.unshift(
            `"${lastInput.clientName}" is both the client name AND a channel — always write "${lastInput.clientName} (client)" when referring to the brand`
          );
        }
        return flags;
      })()
    : [];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-4xl mx-auto px-4 py-10 pb-20">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Image src="/logo.jpeg" alt="Tellagence" width={36} height={36} className="rounded-md" />
            <h1 className="text-2xl font-semibold tracking-tight">Tellagence Insight Assistant</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Translate raw analytics data into strategic narrative. Paste your data, configure the output, generate.
          </p>
        </header>

        <div className="space-y-10">
          <InsightForm onSubmit={handleSubmit} isLoading={isLoading} />

          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <OutputPanel
            results={results}
            loading={loading}
            confusionFlags={activeFlags}
            outputType={lastInput?.outputType ?? 'all'}
            clientName={lastInput?.clientName ?? ''}
            campaignName={lastInput?.campaignName ?? ''}
          />
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-2.5 text-xs text-neutral-400 text-center">
        v1.0 — Voice calibrated May 2026
      </footer>
    </div>
  );
}
