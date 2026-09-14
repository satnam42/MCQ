/**
 * Frontend Note Parser Utility
 * Converts Markdown-like text to structured, card-based HTML for instant preview.
 * Preserves Punjabi Unicode text without transliteration.
 */

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseInline(text) {
  let escaped = escapeHtml(text);
  // Bold **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return escaped;
}

function isExamFactsSection(sectionTitle) {
  if (!sectionTitle) return false;
  const lower = sectionTitle.toLowerCase();
  return (
    lower.includes('exam fact') ||
    lower.includes('ਮਹੱਤਵਪੂਰਨ ਤੱਥ') ||
    lower.includes('exam tricks') ||
    lower.includes('ਤੱਥ') ||
    lower.includes('important fact')
  );
}

export function parseNoteToHtml(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  const lines = rawText.split(/\r?\n/);
  const result = [];
  let inList = false;
  let inSectionCard = false;
  let isFirstHeading = true;

  lines.forEach((lineStr) => {
    const line = lineStr.trim();

    if (!line) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      return;
    }

    // Heading conversion ### Heading
    if (line.startsWith('#')) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }

      const clean = parseInline(line.replace(/^#+\s*/, ''));
      if (isFirstHeading) {
        result.push(`<h1 class="notes-main-title">${clean}</h1>`);
        isFirstHeading = false;
      } else {
        if (inSectionCard) {
          result.push('</section>');
          inSectionCard = false;
        }

        const isSpecial = isExamFactsSection(clean);
        const cardClass = isSpecial ? 'notes-exam-facts-card' : 'notes-section-card';

        result.push(`<section class="${cardClass}">`);
        result.push(`  <h2 class="notes-section-title"><span class="notes-accent-indicator">▌</span> ${clean}</h2>`);
        inSectionCard = true;
      }
      return;
    }

    // Standalone section heading **Section**
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4 && !line.substring(2, line.length - 2).includes('**')) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      const title = line.substring(2, line.length - 2).trim();
      const parsedTitle = parseInline(title);

      if (isFirstHeading) {
        result.push(`<h1 class="notes-main-title">${parsedTitle}</h1>`);
        isFirstHeading = false;
      } else {
        if (inSectionCard) {
          result.push('</section>');
          inSectionCard = false;
        }

        const isSpecial = isExamFactsSection(title);
        const cardClass = isSpecial ? 'notes-exam-facts-card' : 'notes-section-card';

        result.push(`<section class="${cardClass}">`);
        result.push(`  <h2 class="notes-section-title"><span class="notes-accent-indicator">▌</span> ${parsedTitle}</h2>`);
        inSectionCard = true;
      }
      return;
    }

    // Bullet item - Item or * Item or • Item or ★ Item -> <li>Item</li>
    if (/^[-*•★]\s+/.test(line)) {
      if (!inList) {
        result.push('<ul class="notes-list">');
        inList = true;
      }
      const itemText = line.replace(/^[-*•★]\s+/, '');
      result.push(`  <li>${parseInline(itemText)}</li>`);
      return;
    }

    // Regular text paragraph
    if (inList) {
      result.push('</ul>');
      inList = false;
    }
    result.push(`<p class="notes-paragraph">${parseInline(line)}</p>`);
  });

  if (inList) {
    result.push('</ul>');
  }

  if (inSectionCard) {
    result.push('</section>');
  }

  return result.join('\n');
}
