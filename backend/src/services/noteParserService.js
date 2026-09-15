/**
 * Text to HTML Parser Service for Punjabi Study Notes
 * Converts Markdown-like text into structured, card-based HTML for professional exam study notes.
 */

function parseInlineFormatting(text) {
  if (!text) return '';
  
  // Escape potential raw HTML brackets to prevent XSS before parsing markdown tags
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert **bold** to <strong>bold</strong>
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert *italic* or _italic_ to <em>italic</em>
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
  escaped = escaped.replace(/_(.*?)_/g, '<em>$1</em>');

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

function parseTextToHtml(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  const lines = rawText.split(/\r?\n/);
  const htmlParts = [];
  let inList = false;
  let inSectionCard = false;
  let isFirstHeading = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      continue;
    }

    // 1. Check for Main Title `# Heading` or `### Heading`
    if (line.startsWith('#')) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }

      const cleanHeading = parseInlineFormatting(line.replace(/^#+\s*/, ''));
      if (isFirstHeading) {
        htmlParts.push(`<h1 class="notes-main-title">${cleanHeading}</h1>`);
        isFirstHeading = false;
      } else {
        if (inSectionCard) {
          htmlParts.push('</section>');
          inSectionCard = false;
        }

        const isSpecial = isExamFactsSection(cleanHeading);
        const cardClass = isSpecial ? 'notes-exam-facts-card' : 'notes-section-card';

        htmlParts.push(`<section class="${cardClass}">`);
        htmlParts.push(`  <h2 class="notes-section-title"><span class="notes-accent-indicator">▌</span> ${cleanHeading}</h2>`);
        inSectionCard = true;
      }
      continue;
    }

    // 2. Check for Standalone Section Heading `**Section Heading**`
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4 && !line.substring(2, line.length - 2).includes('**')) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      const sectionName = line.substring(2, line.length - 2).trim();
      const escapedSection = parseInlineFormatting(sectionName);
      
      if (isFirstHeading) {
        htmlParts.push(`<h1 class="notes-main-title">${escapedSection}</h1>`);
        isFirstHeading = false;
      } else {
        if (inSectionCard) {
          htmlParts.push('</section>');
          inSectionCard = false;
        }

        const isSpecial = isExamFactsSection(sectionName);
        const cardClass = isSpecial ? 'notes-exam-facts-card' : 'notes-section-card';

        htmlParts.push(`<section class="${cardClass}">`);
        htmlParts.push(`  <h2 class="notes-section-title"><span class="notes-accent-indicator">▌</span> ${escapedSection}</h2>`);
        inSectionCard = true;
      }
      continue;
    }

    // 3. Check for list item `- Item` or `* Item` or `• Item` or `★ Item`
    if (/^[-*•★]\s+/.test(line)) {
      if (!inList) {
        htmlParts.push('<ul class="notes-list">');
        inList = true;
      }
      const itemContent = line.replace(/^[-*•★]\s+/, '');
      const formattedItem = parseInlineFormatting(itemContent);
      htmlParts.push(`  <li>${formattedItem}</li>`);
      continue;
    }

    // 4. Regular Paragraph / Text Line
    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }

    const formattedParagraph = parseInlineFormatting(line);
    htmlParts.push(`<p class="notes-paragraph">${formattedParagraph}</p>`);
  }

  if (inList) {
    htmlParts.push('</ul>');
  }

  if (inSectionCard) {
    htmlParts.push('</section>');
  }

  return htmlParts.join('\n');
}

/**
 * Sanitize HTML string to prevent XSS vulnerability while keeping required elements.
 */
function sanitizeHtmlContent(html) {
  if (!html) return '';

  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  return sanitized;
}

module.exports = {
  parseTextToHtml,
  sanitizeHtmlContent,
  parseInlineFormatting,
};
