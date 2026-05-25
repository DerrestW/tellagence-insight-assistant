import pptxgen from 'pptxgenjs';

const BRAND_BLUE = '3333EE';
const WHITE = 'FFFFFF';
const NEAR_BLACK = '111111';
const LIGHT_GRAY = 'F5F5F5';
const MID_GRAY = '888888';

const SLIDE_W = 13.33;
const MARGIN = 0.55;
const CONTENT_W = SLIDE_W - MARGIN * 2;
const FOOTER_Y = 6.9;

interface PptxInput {
  clientName: string;
  campaignName: string;
  tldr?: string;
  insights?: string;
  analyst_qs?: string;
  content_qs?: string;
}

async function fetchLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch('/logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function addBrandFooter(slide: pptxgen.Slide, label: string) {
  slide.addText(`Tellagence  ·  ${label}`, {
    x: MARGIN, y: FOOTER_Y, w: CONTENT_W, h: 0.25,
    fontSize: 7, color: MID_GRAY, align: 'left',
  });
}

function addLogoToSlide(slide: pptxgen.Slide, logoData: string | null) {
  if (!logoData) return;
  slide.addImage({ data: logoData, x: SLIDE_W - MARGIN - 0.45, y: FOOTER_Y - 0.05, w: 0.45, h: 0.45 });
}

function splitInsights(text: string): { title: string; data: string; implications: string }[] {
  const dataMarker = /What the data is telling us:/gi;
  const implMarker = /What this means for how we think about content going forward:/gi;

  const blocks: { title: string; data: string; implications: string }[] = [];

  // Split on double-newline sequences between insights
  const chunks = text.split(/\n{2,}(?=[A-Z\d])/);

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    const dataMatch = trimmed.search(dataMarker);
    const implMatch = trimmed.search(implMarker);

    if (dataMatch === -1) continue;

    const title = trimmed.slice(0, dataMatch).replace(/\n/g, ' ').trim();
    const dataText = implMatch > -1
      ? trimmed.slice(dataMatch + 'What the data is telling us:'.length, implMatch).trim()
      : trimmed.slice(dataMatch + 'What the data is telling us:'.length).trim();
    const implText = implMatch > -1
      ? trimmed.slice(implMatch + 'What this means for how we think about content going forward:'.length).trim()
      : '';

    if (title || dataText) {
      blocks.push({ title, data: dataText, implications: implText });
    }
  }

  return blocks;
}

function splitQuestions(text: string): { question: string; context: string }[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const questions: { question: string; context: string }[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Heuristic: questions end with ? or start with "Can we" / "Was" / "How" / "What" / numbered
    if (line.endsWith('?') || /^(Can |Was |How |What |Did |Is |Are |Could |Would |Should |\d+\.\s)/.test(line)) {
      const contextLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].endsWith('?') && !/^(Can |Was |How |What |Did |Is |Are |Could |Would |Should |\d+\.\s)/.test(lines[i])) {
        contextLines.push(lines[i]);
        i++;
      }
      questions.push({ question: line, context: contextLines.join(' ') });
    } else {
      i++;
    }
  }

  return questions;
}

export async function generatePptx(input: PptxInput) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';

  const logoData = await fetchLogoBase64();
  const campaignLabel = input.campaignName || 'Campaign Report';
  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ─── Slide 1: Title ───────────────────────────────────────────────
  const s1 = pptx.addSlide();
  s1.background = { color: BRAND_BLUE };

  if (logoData) {
    s1.addImage({ data: logoData, x: MARGIN, y: 1.8, w: 1.1, h: 1.1 });
  }

  s1.addText(input.clientName, {
    x: MARGIN, y: 3.1, w: CONTENT_W, h: 1.0,
    fontSize: 42, bold: true, color: WHITE, align: 'left',
  });
  s1.addText(campaignLabel, {
    x: MARGIN, y: 4.05, w: CONTENT_W, h: 0.5,
    fontSize: 20, color: WHITE, align: 'left',
  });
  s1.addText(dateLabel, {
    x: MARGIN, y: 4.6, w: CONTENT_W, h: 0.35,
    fontSize: 13, color: 'AAAAFF', align: 'left',
  });
  s1.addText('Confidential · Prepared by Tellagence', {
    x: MARGIN, y: FOOTER_Y, w: CONTENT_W, h: 0.25,
    fontSize: 8, color: 'AAAAFF', align: 'left',
  });

  // ─── Slide 2: TL;DR ───────────────────────────────────────────────
  if (input.tldr) {
    const s2 = pptx.addSlide();
    s2.background = { color: WHITE };

    s2.addText('TL;DR', {
      x: MARGIN, y: 0.45, w: 3, h: 0.35,
      fontSize: 10, bold: true, color: BRAND_BLUE, align: 'left', charSpacing: 2,
    });
    s2.addText(input.clientName + (input.campaignName ? ` · ${input.campaignName}` : ''), {
      x: MARGIN, y: 0.8, w: CONTENT_W, h: 0.45,
      fontSize: 22, bold: true, color: NEAR_BLACK, align: 'left',
    });
    s2.addShape(pptxgen.ShapeType.rect, {
      x: MARGIN, y: 1.35, w: CONTENT_W, h: 0.025, fill: { color: BRAND_BLUE },
    });

    s2.addText(input.tldr, {
      x: MARGIN, y: 1.6, w: CONTENT_W, h: 5.0,
      fontSize: 14, color: NEAR_BLACK, align: 'left', valign: 'top',
      lineSpacingMultiple: 1.4, wrap: true,
    });

    addBrandFooter(s2, campaignLabel);
    addLogoToSlide(s2, logoData);
  }

  // ─── Slides 3–5: Insights ─────────────────────────────────────────
  if (input.insights) {
    const blocks = splitInsights(input.insights);

    if (blocks.length === 0) {
      // Fallback: dump all insights on one slide
      const si = pptx.addSlide();
      si.background = { color: WHITE };
      si.addText('INSIGHTS', {
        x: MARGIN, y: 0.45, w: 3, h: 0.35,
        fontSize: 10, bold: true, color: BRAND_BLUE, charSpacing: 2,
      });
      si.addShape(pptxgen.ShapeType.rect, {
        x: MARGIN, y: 0.9, w: CONTENT_W, h: 0.025, fill: { color: BRAND_BLUE },
      });
      si.addText(input.insights, {
        x: MARGIN, y: 1.1, w: CONTENT_W, h: 5.5,
        fontSize: 11, color: NEAR_BLACK, align: 'left', valign: 'top',
        lineSpacingMultiple: 1.35, wrap: true,
      });
      addBrandFooter(si, campaignLabel);
      addLogoToSlide(si, logoData);
    } else {
      blocks.forEach((block, idx) => {
        const si = pptx.addSlide();
        si.background = { color: WHITE };

        si.addText(`INSIGHT ${idx + 1} OF ${blocks.length}`, {
          x: MARGIN, y: 0.45, w: 4, h: 0.3,
          fontSize: 9, bold: true, color: BRAND_BLUE, charSpacing: 2,
        });

        si.addText(block.title || `Insight ${idx + 1}`, {
          x: MARGIN, y: 0.8, w: CONTENT_W, h: 0.6,
          fontSize: 20, bold: true, color: NEAR_BLACK, align: 'left', wrap: true,
        });

        si.addShape(pptxgen.ShapeType.rect, {
          x: MARGIN, y: 1.5, w: CONTENT_W, h: 0.025, fill: { color: BRAND_BLUE },
        });

        // Left column: What the data is telling us
        si.addText('What the data is telling us', {
          x: MARGIN, y: 1.65, w: 5.9, h: 0.28,
          fontSize: 9, bold: true, color: BRAND_BLUE,
        });
        si.addText(block.data, {
          x: MARGIN, y: 1.95, w: 5.9, h: 4.6,
          fontSize: 10.5, color: NEAR_BLACK, align: 'left', valign: 'top',
          lineSpacingMultiple: 1.4, wrap: true,
        });

        // Right column: Implications
        if (block.implications) {
          si.addShape(pptxgen.ShapeType.rect, {
            x: MARGIN + 6.2, y: 1.65, w: CONTENT_W - 6.2, h: 5.0,
            fill: { color: LIGHT_GRAY }, line: { color: LIGHT_GRAY },
          });
          si.addText('What this means going forward', {
            x: MARGIN + 6.4, y: 1.8, w: CONTENT_W - 6.6, h: 0.28,
            fontSize: 9, bold: true, color: BRAND_BLUE,
          });
          si.addText(block.implications, {
            x: MARGIN + 6.4, y: 2.15, w: CONTENT_W - 6.6, h: 4.4,
            fontSize: 10, color: NEAR_BLACK, align: 'left', valign: 'top',
            lineSpacingMultiple: 1.4, wrap: true,
          });
        }

        addBrandFooter(si, campaignLabel);
        addLogoToSlide(si, logoData);
      });
    }
  }

  // ─── Slide: Analyst Questions ──────────────────────────────────────
  if (input.analyst_qs) {
    const sq = pptx.addSlide();
    sq.background = { color: WHITE };
    sq.addText('ANALYST QUESTIONS', {
      x: MARGIN, y: 0.45, w: 5, h: 0.3,
      fontSize: 9, bold: true, color: BRAND_BLUE, charSpacing: 2,
    });
    sq.addText('Questions for the analytics team', {
      x: MARGIN, y: 0.8, w: CONTENT_W, h: 0.45,
      fontSize: 22, bold: true, color: NEAR_BLACK,
    });
    sq.addShape(pptxgen.ShapeType.rect, {
      x: MARGIN, y: 1.35, w: CONTENT_W, h: 0.025, fill: { color: BRAND_BLUE },
    });

    const questions = splitQuestions(input.analyst_qs);
    if (questions.length > 0) {
      questions.forEach((q, i) => {
        const yBase = 1.6 + i * 1.6;
        sq.addText(q.question, {
          x: MARGIN, y: yBase, w: CONTENT_W, h: 0.4,
          fontSize: 13, bold: true, color: NEAR_BLACK, wrap: true,
        });
        if (q.context) {
          sq.addText(q.context, {
            x: MARGIN, y: yBase + 0.42, w: CONTENT_W, h: 1.1,
            fontSize: 11, color: '444444', align: 'left', valign: 'top',
            lineSpacingMultiple: 1.35, wrap: true,
          });
        }
      });
    } else {
      sq.addText(input.analyst_qs, {
        x: MARGIN, y: 1.55, w: CONTENT_W, h: 5.0,
        fontSize: 11, color: NEAR_BLACK, align: 'left', valign: 'top',
        lineSpacingMultiple: 1.4, wrap: true,
      });
    }

    addBrandFooter(sq, campaignLabel);
    addLogoToSlide(sq, logoData);
  }

  // ─── Slide: Content Team Questions ───────────────────────────────
  if (input.content_qs) {
    const sc = pptx.addSlide();
    sc.background = { color: WHITE };
    sc.addText('CONTENT TEAM QUESTIONS', {
      x: MARGIN, y: 0.45, w: 6, h: 0.3,
      fontSize: 9, bold: true, color: BRAND_BLUE, charSpacing: 2,
    });
    sc.addText('Questions for the content strategy team', {
      x: MARGIN, y: 0.8, w: CONTENT_W, h: 0.45,
      fontSize: 22, bold: true, color: NEAR_BLACK,
    });
    sc.addShape(pptxgen.ShapeType.rect, {
      x: MARGIN, y: 1.35, w: CONTENT_W, h: 0.025, fill: { color: BRAND_BLUE },
    });

    const questions = splitQuestions(input.content_qs);
    if (questions.length > 0) {
      questions.forEach((q, i) => {
        const yBase = 1.6 + i * 1.6;
        sc.addText(q.question, {
          x: MARGIN, y: yBase, w: CONTENT_W, h: 0.4,
          fontSize: 13, bold: true, color: NEAR_BLACK, wrap: true,
        });
        if (q.context) {
          sc.addText(q.context, {
            x: MARGIN, y: yBase + 0.42, w: CONTENT_W, h: 1.1,
            fontSize: 11, color: '444444', align: 'left', valign: 'top',
            lineSpacingMultiple: 1.35, wrap: true,
          });
        }
      });
    } else {
      sc.addText(input.content_qs, {
        x: MARGIN, y: 1.55, w: CONTENT_W, h: 5.0,
        fontSize: 11, color: NEAR_BLACK, align: 'left', valign: 'top',
        lineSpacingMultiple: 1.4, wrap: true,
      });
    }

    addBrandFooter(sc, campaignLabel);
    addLogoToSlide(sc, logoData);
  }

  // ─── Generate file name and download ──────────────────────────────
  const safeName = [input.clientName, input.campaignName]
    .filter(Boolean)
    .join(' — ')
    .replace(/[^a-z0-9 —]/gi, '')
    .trim() || 'Tellagence Report';

  await pptx.writeFile({ fileName: `${safeName}.pptx` });
}
