import React from 'react';
import { parseNoteToHtml } from '../../utils/noteParser';

/**
 * Renders structured JSON note documents safely into React elements.
 * Supports Tiptap/ProseMirror JSON schema, custom structured note JSON schema,
 * as well as legacy Markdown/HTML plain text formats.
 */

function sanitizeHref(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
    return '#';
  }
  return trimmed;
}

function renderTextNode(node, keyIndex) {
  if (!node) return null;

  let text = node.text || '';
  if (!text && node.children) {
    return node.children.map((child, idx) => renderTextNode(child, `${keyIndex}-${idx}`));
  }

  // Handle inline property object style (e.g. { text: "...", bold: true, fontSize: 18 })
  let content = <span key={keyIndex}>{text}</span>;

  let style = {};

  // Check inline attributes directly on node (e.g. custom JSON format)
  if (node.fontSize) {
    style.fontSize = typeof node.fontSize === 'number' ? `${node.fontSize}px` : node.fontSize;
  }
  if (node.fontFamily) {
    style.fontFamily = node.fontFamily;
  }
  if (node.textColor || node.color) {
    style.color = node.textColor || node.color;
  }
  if (node.highlight || node.backgroundColor) {
    style.backgroundColor = node.highlight || node.backgroundColor;
  }

  // Check marks array (Tiptap / ProseMirror standard)
  const marks = node.marks || [];

  for (const mark of marks) {
    const type = mark.type;
    const attrs = mark.attrs || {};

    if (type === 'textStyle') {
      if (attrs.color) style.color = attrs.color;
      if (attrs.fontSize) style.fontSize = typeof attrs.fontSize === 'number' ? `${attrs.fontSize}px` : attrs.fontSize;
      if (attrs.fontFamily) style.fontFamily = attrs.fontFamily;
    }
    if (type === 'color' && attrs.color) {
      style.color = attrs.color;
    }
  }

  // Apply style wrapper if styles exist
  if (Object.keys(style).length > 0) {
    content = <span key={`style-${keyIndex}`} style={style}>{text}</span>;
  }

  // Apply inline tags (Bold, Italic, Underline, Strike, Highlight, Link)
  const isBold = node.bold || marks.some((m) => m.type === 'bold');
  const isItalic = node.italic || marks.some((m) => m.type === 'italic');
  const isUnderline = node.underline || marks.some((m) => m.type === 'underline');
  const isStrike = node.strike || node.strikethrough || marks.some((m) => m.type === 'strike');

  const highlightMark = marks.find((m) => m.type === 'highlight');
  const highlightColor = node.highlight || (highlightMark && highlightMark.attrs ? highlightMark.attrs.color : null);

  const linkMark = marks.find((m) => m.type === 'link');
  const linkHref = node.href || node.url || (linkMark && linkMark.attrs ? linkMark.attrs.href : null);

  if (isBold) {
    content = <strong key={`b-${keyIndex}`}>{content}</strong>;
  }
  if (isItalic) {
    content = <em key={`i-${keyIndex}`}>{content}</em>;
  }
  if (isUnderline) {
    content = <u key={`u-${keyIndex}`}>{content}</u>;
  }
  if (isStrike) {
    content = <s key={`s-${keyIndex}`}>{content}</s>;
  }
  if (highlightColor) {
    content = (
      <mark
        key={`hl-${keyIndex}`}
        className="px-1 py-0.5 rounded"
        style={{ backgroundColor: highlightColor }}
      >
        {content}
      </mark>
    );
  } else if (node.highlight === true) {
    content = (
      <mark key={`hl-${keyIndex}`} className="bg-amber-200 px-1 py-0.5 rounded">
        {content}
      </mark>
    );
  }
  if (linkHref) {
    const safeUrl = sanitizeHref(linkHref);
    content = (
      <a
        key={`link-${keyIndex}`}
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-700 hover:text-amber-800 underline font-medium"
      >
        {content}
      </a>
    );
  }

  return content;
}

function renderNode(node, keyIndex) {
  if (!node) return null;

  const type = node.type || 'paragraph';
  const children = node.content || node.children || [];
  const attrs = node.attrs || {};

  const alignClass = attrs.textAlign
    ? attrs.textAlign === 'center'
      ? 'text-center'
      : attrs.textAlign === 'right'
      ? 'text-right'
      : attrs.textAlign === 'justify'
      ? 'text-justify'
      : 'text-left'
    : '';

  const renderedChildren = children.map((child, idx) => {
    if (child.type === 'text') {
      return renderTextNode(child, `${keyIndex}-${idx}`);
    }
    return renderNode(child, `${keyIndex}-${idx}`);
  });

  switch (type) {
    case 'doc':
      return <div key={keyIndex} className="space-y-4">{renderedChildren}</div>;

    case 'heading': {
      const level = attrs.level || node.level || 2;
      const Tag = level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
      
      const headingClasses = {
        h1: 'text-2xl sm:text-3xl font-extrabold text-amber-950 font-gurmukhi border-b border-amber-200 pb-2 mb-3 mt-6',
        h2: 'text-xl sm:text-2xl font-bold text-amber-900 font-gurmukhi mb-2 mt-5 flex items-center gap-2',
        h3: 'text-lg sm:text-xl font-bold text-amber-800 font-gurmukhi mb-2 mt-4',
        h4: 'text-base sm:text-lg font-bold text-slate-800 font-gurmukhi mb-1 mt-3',
      };

      return (
        <Tag key={keyIndex} className={`${headingClasses[Tag]} ${alignClass}`}>
          {Tag === 'h2' && <span className="text-amber-500 font-normal">▌</span>}
          {renderedChildren}
        </Tag>
      );
    }

    case 'paragraph':
      return (
        <p key={keyIndex} className={`notes-paragraph leading-relaxed text-slate-800 font-gurmukhi ${alignClass}`}>
          {renderedChildren.length > 0 ? renderedChildren : <br />}
        </p>
      );

    case 'bulletList':
    case 'bulleted-list':
      return (
        <ul key={keyIndex} className={`list-disc pl-6 space-y-1.5 my-3 text-slate-800 font-gurmukhi ${alignClass}`}>
          {renderedChildren}
        </ul>
      );

    case 'orderedList':
    case 'numbered-list':
      return (
        <ol key={keyIndex} className={`list-decimal pl-6 space-y-1.5 my-3 text-slate-800 font-gurmukhi ${alignClass}`}>
          {renderedChildren}
        </ol>
      );

    case 'listItem':
    case 'list-item':
      return (
        <li key={keyIndex} className="pl-1 leading-relaxed font-gurmukhi">
          {renderedChildren}
        </li>
      );

    case 'blockquote':
    case 'quote':
      return (
        <blockquote
          key={keyIndex}
          className="border-l-4 border-amber-500 bg-amber-50/80 p-4 rounded-r-xl italic text-amber-950 my-4 shadow-sm font-gurmukhi"
        >
          {renderedChildren}
        </blockquote>
      );

    case 'horizontalRule':
    case 'divider':
      return <hr key={keyIndex} className="my-6 border-t-2 border-amber-200/80" />;

    default:
      if (node.text) {
        return renderTextNode(node, keyIndex);
      }
      return <div key={keyIndex}>{renderedChildren}</div>;
  }
}

export function NoteRenderer({ note, rawContent }) {
  const contentToRender = rawContent || (note ? note.raw_content || note.rawContent || note.content || note.html_content || note.htmlContent : '');

  if (!contentToRender) {
    return (
      <div className="p-6 text-center text-slate-400 font-gurmukhi">
        ਕੋਈ ਸਮੱਗਰੀ ਨਹੀਂ (No content)
      </div>
    );
  }

  // 1. Check if content is structured JSON (object or JSON string)
  let jsonObj = null;

  if (typeof contentToRender === 'object') {
    jsonObj = contentToRender;
  } else if (typeof contentToRender === 'string') {
    const trimmed = contentToRender.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        jsonObj = JSON.parse(trimmed);
      } catch (e) {
        jsonObj = null;
      }
    }
  }

  // If parsed JSON object is structured document
  if (jsonObj) {
    // If it's standard Tiptap / ProseMirror doc schema
    if (jsonObj.type === 'doc') {
      return (
        <article className="notes-container text-slate-800 leading-relaxed font-gurmukhi">
          {renderNode(jsonObj, 'doc-root')}
        </article>
      );
    }

    // If it's a top-level array of blocks
    if (Array.isArray(jsonObj)) {
      return (
        <article className="notes-container text-slate-800 leading-relaxed font-gurmukhi space-y-4">
          {jsonObj.map((block, idx) => renderNode(block, `arr-${idx}`))}
        </article>
      );
    }

    // If object has `content` array of block nodes
    if (jsonObj.content && Array.isArray(jsonObj.content)) {
      return (
        <article className="notes-container text-slate-800 leading-relaxed font-gurmukhi">
          {renderNode({ type: 'doc', content: jsonObj.content }, 'doc-root')}
        </article>
      );
    }

    // If object has `sections` array (legacy structured section model)
    if (jsonObj.sections && Array.isArray(jsonObj.sections)) {
      return (
        <article className="notes-container text-slate-800 leading-relaxed font-gurmukhi space-y-6">
          {jsonObj.sections.map((sec, idx) => (
            <section key={idx} className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-3">
              {sec.heading && (
                <h2 className="text-xl font-bold text-amber-900 font-gurmukhi flex items-center gap-2">
                  <span className="text-amber-500">▌</span> {sec.heading}
                </h2>
              )}
              {sec.items && Array.isArray(sec.items) && (
                <ul className="list-disc pl-5 space-y-1">
                  {sec.items.map((item, i) => (
                    <li key={i}>{typeof item === 'string' ? item : item.text}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      );
    }
  }

  // 2. If it's HTML string already rendered or legacy text format
  if (typeof contentToRender === 'string') {
    // If string contains HTML tags
    if (/<[a-z][\s\S]*>/i.test(contentToRender)) {
      return (
        <article
          className="notes-container text-slate-800 font-gurmukhi leading-relaxed"
          dangerouslySetInnerHTML={{ __html: contentToRender }}
        />
      );
    }

    // Legacy Markdown-like plain text -> convert using noteParser
    const htmlFromMarkdown = parseNoteToHtml(contentToRender);
    return (
      <article
        className="notes-container text-slate-800 font-gurmukhi leading-relaxed"
        dangerouslySetInnerHTML={{ __html: htmlFromMarkdown }}
      />
    );
  }

  return null;
}

export default NoteRenderer;
