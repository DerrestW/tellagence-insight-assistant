'use client';

import { useState } from 'react';
import ConfusionFlag from './ConfusionFlag';
import { GenerateInput } from '@/app/api/generate/route';

const DEFAULT_TONES = [
  'Confident but not definitive',
  'Genuinely curious',
  'Specific over vague',
  'No filler sentences',
  'Always shows the so what',
];

interface InsightFormProps {
  onSubmit: (input: GenerateInput) => void;
  isLoading: boolean;
}

export default function InsightForm({ onSubmit, isLoading }: InsightFormProps) {
  const [clientName, setClientName] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [channels, setChannels] = useState('');
  const [confusionFlags, setConfusionFlags] = useState<string[]>([]);
  const [analystData, setAnalystData] = useState('');
  const [audience, setAudience] = useState<GenerateInput['audience']>('both');
  const [outputType, setOutputType] = useState<GenerateInput['outputType']>('all');
  const [activeTones, setActiveTones] = useState<string[]>([...DEFAULT_TONES]);

  function toggleTone(tone: string) {
    setActiveTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !analystData.trim()) return;
    onSubmit({
      clientName: clientName.trim(),
      campaignName: campaignName.trim(),
      channels: channels.trim(),
      confusionFlags,
      analystData: analystData.trim(),
      audience,
      outputType,
      activeTones,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Client name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            placeholder="e.g. YouTube"
            className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Campaign name
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g. Met Gala 2026"
            className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Channels deployed
        </label>
        <input
          type="text"
          value={channels}
          onChange={(e) => setChannels(e.target.value)}
          placeholder="e.g. Instagram, TikTok, YouTube Shorts, X"
          className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
        />
        <p className="text-xs text-neutral-500">Comma-separated. Client/channel name collisions are detected automatically.</p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Additional confusion flags
        </label>
        <ConfusionFlag flags={confusionFlags} onChange={setConfusionFlags} />
        <p className="text-xs text-neutral-500">Flag anything that could be misread in the output — abbreviations, shared names, ambiguous terms.</p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Analyst data <span className="text-red-500">*</span>
        </label>
        <textarea
          value={analystData}
          onChange={(e) => setAnalystData(e.target.value)}
          required
          rows={8}
          placeholder="Paste raw analytics data, performance numbers, post-level breakdowns, benchmark comparisons, YoY deltas — anything from the analyst team."
          className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 resize-y min-h-[160px]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Audience
          </label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as GenerateInput['audience'])}
            className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          >
            <option value="both">Both — Editorial & Social Leads</option>
            <option value="editorial">Editorial & Content Strategy</option>
            <option value="social">Social Leads</option>
            <option value="exec">Exec stakeholders</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Output type
          </label>
          <select
            value={outputType}
            onChange={(e) => setOutputType(e.target.value as GenerateInput['outputType'])}
            className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          >
            <option value="all">Full report</option>
            <option value="tldr">TL;DR only</option>
            <option value="insights">Insights only</option>
            <option value="analyst_qs">Analyst questions only</option>
            <option value="content_qs">Content team questions only</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Voice modifiers
        </label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_TONES.map((tone) => {
            const active = activeTones.includes(tone);
            return (
              <button
                key={tone}
                type="button"
                onClick={() => toggleTone(tone)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                    : 'bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                }`}
              >
                {tone}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !clientName.trim() || !analystData.trim()}
        className="w-full py-2.5 px-4 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Generating...' : 'Generate insights'}
      </button>
    </form>
  );
}
