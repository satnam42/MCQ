/**
 * Text to HTML Parser Service for Punjabi Study Notes
 * Converts Markdown-like text or structured JSON document trees into structured HTML.
 */

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseInlineFormatting(text) {
  if (!text) return '';
  let escaped = escapeHtml(text);
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
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

/**
 * Render structured JSON nodes to HTML string on backend
 */
function renderJsonTextNode(node) {
  if (!node) return '';
  let text = escapeHtml(node.text || '');

  let styles = [];
  if (node.fontSize) {
    styles.push(`font-size: ${typeof node.fontSize === 'number' ? node.fontSize + 'px' : node.fontSize}`);
  }
  if (node.fontFamily) {
    styles.push(`font-family: ${node.fontFamily}`);
  }
  if (node.textColor || node.color) {
    styles.push(`color: ${node.textColor || node.color}`);
  }
  if (node.highlight || node.backgroundColor) {
    styles.push(`background-color: ${node.highlight || node.backgroundColor}`);
  }

  const marks = node.marks || [];
  for (const mark of marks) {
    const type = mark.type;
    const attrs = mark.attrs || {};
    if (type === 'textStyle') {
      if (attrs.color) styles.push(`color: ${attrs.color}`);
      if (attrs.fontSize) styles.push(`font-size: ${typeof attrs.fontSize === 'number' ? attrs.fontSize + 'px' : attrs.fontSize}`);
      if (attrs.fontFamily) styles.push(`font-family: ${attrs.fontFamily}`);
    }
  }

  let content = text;
  if (styles.length > 0) {
    content = `<span style="${styles.join('; ')}">${content}</span>`;
  }

  const isBold = node.bold || marks.some((m) => m.type === 'bold');
  const isItalic = node.italic || marks.some((m) => m.type === 'italic');
  const isUnderline = node.underline || marks.some((m) => m.type === 'underline');
  const isStrike = node.strike || node.strikethrough || marks.some((m) => m.type === 'strike');

  const highlightMark = marks.find((m) => m.type === 'highlight');
  const highlightColor = node.highlight || (highlightMark && highlightMark.attrs ? highlightMark.attrs.color : null);

  const linkMark = marks.find((m) => m.type === 'link');
  const linkHref = node.href || node.url || (linkMark && linkMark.attrs ? linkMark.attrs.href : null);

  if (isBold) content = `<strong>${content}</strong>`;
  if (isItalic) content = `<em>${content}</em>`;
  if (isUnderline) content = `<u>${content}</u>`;
  if (isStrike) content = `<s>${content}</s>`;

  if (highlightColor && typeof highlightColor === 'string') {
    content = `<mark style="background-color: ${highlightColor}; padding: 0.1rem 0.25rem; border-radius: 0.25rem;">${content}</mark>`;
  } else if (node.highlight === true) {
    content = `<mark class="bg-amber-200" style="padding: 0.1rem 0.25rem; border-radius: 0.25rem;">${content}</mark>`;
  }

  if (linkHref && !linkHref.startsWith('javascript:')) {
    content = `<a href="${escapeHtml(linkHref)}" target="_blank" rel="noopener noreferrer" class="text-amber-700 underline font-medium">${content}</a>`;
  }

  return content;
}

function renderJsonNode(node) {
  if (!node) return '';
  const type = node.type || 'paragraph';
  const children = node.content || node.children || [];
  const attrs = node.attrs || {};

  const childHtml = children
    .map((c) => (c.type === 'text' ? renderJsonTextNode(c) : renderJsonNode(c)))
    .join('');

  const alignStyle = attrs.textAlign ? ` style="text-align: ${attrs.textAlign}"` : '';

  switch (type) {
    case 'doc':
      return `<div class="notes-container">${childHtml}</div>`;
    case 'heading': {
      const level = attrs.level || node.level || 2;
      return `<h${level}${alignStyle} class="notes-heading h${level}">${childHtml}</h${level}>`;
    }
    case 'paragraph':
      return `<p${alignStyle} class="notes-paragraph">${childHtml || '<br>'}</p>`;
    case 'bulletList':
    case 'bulleted-list':
      return `<ul class="notes-list list-disc pl-6 my-2">${childHtml}</ul>`;
    case 'orderedList':
    case 'numbered-list':
      return `<ol class="notes-list list-decimal pl-6 my-2">${childHtml}</ol>`;
    case 'listItem':
    case 'list-item':
      return `<li>${childHtml}</li>`;
    case 'blockquote':
    case 'quote':
      return `<blockquote class="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-xl italic my-3">${childHtml}</blockquote>`;
    case 'horizontalRule':
    case 'divider':
      return `<hr class="my-6 border-t-2 border-amber-200" />`;
    default:
      return childHtml;
  }
}

function convertJsonToHtml(jsonObj) {
  if (!jsonObj) return '';
  if (jsonObj.type === 'doc') {
    return renderJsonNode(jsonObj);
  }
  if (Array.isArray(jsonObj)) {
    return jsonObj.map(renderJsonNode).join('\n');
  }
  if (jsonObj.content && Array.isArray(jsonObj.content)) {
    return renderJsonNode({ type: 'doc', content: jsonObj.content });
  }
  return '';
}

function parseTextToHtml(rawText) {
  if (!rawText) return '';

  if (typeof rawText === 'object') {
    return convertJsonToHtml(rawText);
  }

  if (typeof rawText === 'string') {
    const trimmed = rawText.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const jsonObj = JSON.parse(trimmed);
        const jsonHtml = convertJsonToHtml(jsonObj);
        if (jsonHtml) return jsonHtml;
      } catch (e) {
        // Fallback to line-by-line text parser
      }
    }

    // Check if it's already HTML
    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
      return trimmed;
    }
  }

  // Standard line-by-line Markdown-like plain text parser
  const lines = String(rawText).split(/\r?\n/);
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
