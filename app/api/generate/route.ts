import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/systemPrompt';

const client = new Anthropic();

export interface GenerateInput {
  clientName: string;
  campaignName: string;
  channels: string;
  confusionFlags: string[];
  analystData: string;
  audience: 'both' | 'editorial' | 'social' | 'exec';
  outputType: 'all' | 'tldr' | 'insights' | 'analyst_qs' | 'content_qs';
  activeTones: string[];
}

type SectionKey = 'tldr' | 'insights' | 'analyst_qs' | 'content_qs';

const audienceMap: Record<GenerateInput['audience'], string> = {
  both: 'Editorial & Content Strategy team AND Social Leads',
  editorial: 'Editorial & Content Strategy team',
  social: 'Social Leads and content execution teams',
  exec: 'Executive stakeholders who need a fast, clear summary',
};

const sectionInstructions: Record<SectionKey, (audience: string) => string> = {
  tldr: () =>
    `Write a TL;DR of 3–5 sentences. Exec-level summary. Cover: headline result, most important pattern, most compelling opportunity or risk heading forward. Flowing prose, no bullets. Do not start with "This campaign."`,

  insights: (audience) =>
    `Write 3 distinct insights for the ${audience}. Each must follow this structure:
[Short descriptive title]
What the data is telling us:
[Cite specific numbers, posts, and patterns. Be concrete.]
What this means for how we think about content going forward:
[Direct strategy implications. What should change in the brief, the plan, or the resourcing.]
Keep each insight 150–250 words. No padding. Three insights total.`,

  analyst_qs: () =>
    `List 3 questions to bring back to the analytics team. Format each as:
[Question stated directly]
[2–3 sentences: what gap does this fill, or what decision does it help make]
Focus on data gaps that would affect the next brief or activation plan.`,

  content_qs: () =>
    `List 3 questions to bring to the content strategy team. Format each as:
[Question stated directly]
[2–3 sentences: what you're trying to understand or pressure-test from the data]
Focus on execution decisions that affect how we interpret performance numbers.`,
};

function buildUserMessage(input: GenerateInput, section: SectionKey): string {
  const allFlags = [...input.confusionFlags];

  const channels = input.channels.split(',').map((c) => c.trim()).filter(Boolean);
  const collision = channels.find((c) =>
    c.toLowerCase().includes(input.clientName.toLowerCase())
  );
  if (collision) {
    allFlags.unshift(
      `"${input.clientName}" is both the client name AND a channel — always write "${input.clientName} (client)" when referring to the brand, and use the specific channel format (e.g. "${collision}") when referring to the channel`
    );
  }

  const audience = audienceMap[input.audience];

  return `CLIENT: ${input.clientName}
CAMPAIGN: ${input.campaignName || 'not specified'}
CHANNELS DEPLOYED: ${input.channels || 'not specified'}
AUDIENCE: ${audience}
ACTIVE VOICE MODIFIERS: ${input.activeTones.join(', ') || 'default'}
CONFUSION FLAGS — verify your output against each of these before finalizing:
${allFlags.length > 0 ? allFlags.map((f) => `- ${f}`).join('\n') : '- None added. Standard client/channel disambiguation rules apply.'}
ANALYST DATA:
${input.analystData}
TASK:
${sectionInstructions[section](audience)}`;
}

async function generateSection(input: GenerateInput, section: SectionKey): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(input, section) }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type');
  return block.text;
}

export async function POST(req: NextRequest) {
  try {
    const input: GenerateInput = await req.json();

    if (!input.clientName || !input.analystData) {
      return NextResponse.json({ error: 'clientName and analystData are required' }, { status: 400 });
    }

    const sections: SectionKey[] =
      input.outputType === 'all'
        ? ['tldr', 'insights', 'analyst_qs', 'content_qs']
        : [input.outputType as SectionKey];

    const results: Record<string, string> = {};

    for (const section of sections) {
      results[section] = await generateSection(input, section);
    }

    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
