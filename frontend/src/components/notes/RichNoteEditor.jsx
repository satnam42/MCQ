import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';

import { FontSize, FontFamily } from './editorExtensions';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Indent,
  Outdent,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Highlighter,
  Link as LinkIcon,
  Quote,
  Minus,
  Undo,
  Redo,
  RemoveFormatting,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';

const FONT_SIZES = [
  { label: '14px', value: '14px' },
  { label: '16px (Normal)', value: '16px' },
  { label: '18px (Body)', value: '18px' },
  { label: '20px (Medium)', value: '20px' },
  { label: '22px (Large)', value: '22px' },
  { label: '24px (Title)', value: '24px' },
  { label: '28px (H2)', value: '28px' },
  { label: '32px (H1)', value: '32px' },
];

const FONT_FAMILIES = [
  { label: 'Default Gurmukhi', value: 'inherit' },
  { label: 'Mukta Gurmukhi', value: "'Mukta Gurmukhi', sans-serif" },
  { label: 'Noto Sans Gurmukhi', value: "'Noto Sans Gurmukhi', sans-serif" },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Monospace', value: 'monospace' },
];

const TEXT_COLORS = [
  '#0f172a', // Slate 900
  '#1e293b', // Slate 800
  '#b45309', // Amber 700
  '#d97706', // Amber 600
  '#dc2626', // Red 600
  '#b91c1c', // Red 700
  '#047857', // Emerald 700
  '#1d4ed8', // Blue 700
  '#6b21a8', // Purple 800
];

const HIGHLIGHT_COLORS = [
  '#fef08a', // Yellow 200
  '#fde047', // Yellow 300
  '#fef3c7', // Amber 100
  '#fca5a5', // Red 300
  '#a7f3d0', // Emerald 200
  '#bfdbfe', // Blue 200
  '#e9d5ff', // Purple 200
];

const RichNoteEditor = ({ initialContent, onChange, placeholder = 'ਇੱਥੇ ਸਾਹਿਤਕ ਨੋਟਸ ਲਿਖੋ (Type Punjabi study notes here...)' }) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightColorOpen, setHighlightColorOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      TextStyle,
      FontSize,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-amber-700 hover:text-amber-800 underline font-medium',
        },
      }),
    ],
    content: parseInitialContent(initialContent),
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange({
          json: editor.getJSON(),
          html: editor.getHTML(),
        });
      }
    },
  });

  // Sync editor if initialContent changes externally
  useEffect(() => {
    if (editor && initialContent) {
      const parsed = parseInitialContent(initialContent);
      const currentJson = JSON.stringify(editor.getJSON());
      const newJson = typeof parsed === 'object' ? JSON.stringify(parsed) : null;

      if (newJson && currentJson !== newJson) {
        editor.commands.setContent(parsed, false);
      } else if (typeof parsed === 'string' && editor.getHTML() !== parsed) {
        editor.commands.setContent(parsed, false);
      }
    }
  }, [initialContent, editor]);

  if (!editor) {
    return (
      <div className="p-8 text-center text-slate-400 font-gurmukhi border rounded-2xl animate-pulse">
        ਰਿਚ ਟੈਕਸਟ ਐਡੀਟਰ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ... (Loading Editor...)
      </div>
    );
  }

  function parseInitialContent(content) {
    if (!content) return '';
    if (typeof content === 'object') return content;
    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          return JSON.parse(trimmed);
        } catch (e) {
          return content;
        }
      }
    }
    return content;
  }

  const handleSetLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      let finalUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('/')) {
        finalUrl = `https://${finalUrl}`;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    }
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const openLinkModal = () => {
    const existingHref = editor.getAttributes('link').href || '';
    setLinkUrl(existingHref);
    setShowLinkModal(true);
  };

  return (
    <div className="border border-slate-300 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
      {/* ── RICH TEXT TOOLBAR ── */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 sm:p-3 flex flex-wrap items-center gap-1.5 sm:gap-2 select-none overflow-x-auto">
        {/* Group 1: History / Undo / Redo */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-30 cursor-pointer transition-colors"
            title="Undo (ਕਰੋ ਪਿਛਲਾ)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-30 cursor-pointer transition-colors"
            title="Redo (ਦੁਬਾਰਾ ਕਰੋ)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Group 2: Inline Styles (Bold, Italic, Underline, Strikethrough) */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive('bold') ? 'bg-amber-500 text-white font-bold' : 'hover:bg-slate-200'
            }`}
            title="Bold (ਗੂੜ੍ਹਾ)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive('italic') ? 'bg-amber-500 text-white font-bold' : 'hover:bg-slate-200'
            }`}
            title="Italic (ਟੇਢਾ)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive('underline') ? 'bg-amber-500 text-white font-bold' : 'hover:bg-slate-200'
            }`}
            title="Underline (ਹੇਠਾਂ ਲਾਈਨ)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive('strike') ? 'bg-amber-500 text-white font-bold' : 'hover:bg-slate-200'
            }`}
            title="Strikethrough (ਵਿਚਕਾਰ ਲਾਈਨ)"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Group 3: Font Size & Font Family */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-200">
          {/* Font Family Dropdown */}
          <select
            value={editor.getAttributes('textStyle').fontFamily || 'inherit'}
            onChange={(e) => {
              if (e.target.value === 'inherit') {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(e.target.value).run();
              }
            }}
            className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            title="Font Family"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Font Size Dropdown */}
          <select
            value={editor.getAttributes('textStyle').fontSize || '18px'}
            onChange={(e) => {
              editor.chain().focus().setFontSize(e.target.value).run();
            }}
            className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-mono"
            title="Font Size"
          >
            {FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Group 4: Headings Dropdown */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-200">
          <select
            value={
              editor.isActive('heading', { level: 1 })
                ? 'h1'
                : editor.isActive('heading', { level: 2 })
                ? 'h2'
                : editor.isActive('heading', { level: 3 })
                ? 'h3'
                : editor.isActive('heading', { level: 4 })
                ? 'h4'
                : 'p'
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'p') {
                editor.chain().focus().setParagraph().run();
              } else {
                const lvl = parseInt(val.replace('h', ''), 10);
                editor.chain().focus().toggleHeading({ level: lvl }).run();
              }
            }}
            className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-gurmukhi"
            title="Paragraph / Heading Level"
          >
            <option value="p">Normal (ਸਧਾਰਨ ਪੈਰਾ)</option>
            <option value="h1">Heading 1 (ਮੁੱਖ ਸਿਰਲੇਖ)</option>
            <option value="h2">Heading 2 (ਸੈਕਸ਼ਨ ਸਿਰਲੇਖ)</option>
            <option value="h3">Heading 3 (ਉਪ ਸਿਰਲੇਖ)</option>
            <option value="h4">Heading 4 (ਛੋਟਾ ਸਿਰਲੇਖ)</option>
          </select>
        </div>

        {/* Group 5: Lists & Indentation */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive('bulletList') ? 'bg-amber-500 text-white' : 'hover:bg-slate-200'
            }`}
            title="Bullet List (ਬੁਲੇਟ ਸੂਚੀ)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive('orderedList') ? 'bg-amber-500 text-white' : 'hover:bg-slate-200'
            }`}
            title="Numbered List (ਨੰਬਰ ਵਾਲੀ ਸੂਚੀ)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
            disabled={!editor.can().sinkListItem('listItem')}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-30 cursor-pointer transition-colors"
            title="Indent (ਅੱਗੇ ਕਰੋ)"
          >
            <Indent className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().liftListItem('listItem').run()}
            disabled={!editor.can().liftListItem('listItem')}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-30 cursor-pointer transition-colors"
            title="Outdent (ਪਿੱਛੇ ਕਰੋ)"
          >
            <Outdent className="w-4 h-4" />
          </button>
        </div>

        {/* Group 6: Text Alignment */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-amber-500 text-white' : 'hover:bg-slate-200'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-amber-500 text-white' : 'hover:bg-slate-200'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-amber-500 text-white' : 'hover:bg-slate-200'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-amber-500 text-white' : 'hover:bg-slate-200'
            }`}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Group 7: Text Color & Highlight */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-200 relative">
          {/* Text Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setTextColorOpen(!textColorOpen);
                setHighlightColorOpen(false);
              }}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 cursor-pointer flex items-center space-x-1 transition-colors"
              title="Text Color (ਅੱਖਰਾਂ ਦਾ ਰੰਗ)"
            >
              <Palette className="w-4 h-4 text-amber-700" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {textColorOpen && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-xl shadow-xl z-30 flex items-center gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      editor.chain().focus().setColor(c).run();
                      setTextColorOpen(false);
                    }}
                    className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setTextColorOpen(false);
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-900 px-1"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Highlight Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setHighlightColorOpen(!highlightColorOpen);
                setTextColorOpen(false);
              }}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 cursor-pointer flex items-center space-x-1 transition-colors"
              title="Highlight Background (ਰੰਗ ਹਾਈਲਾਈਟ)"
            >
              <Highlighter className="w-4 h-4 text-amber-600" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {highlightColorOpen && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-xl shadow-xl z-30 flex items-center gap-1.5">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      editor.chain().focus().setHighlight({ color: c }).run();
                      setHighlightColorOpen(false);
                    }}
                    className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setHighlightColorOpen(false);
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-900 px-1"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Group 8: Insert (Link, Quote, Divider) */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-200">
          <button
            type="button"
            onClick={openLinkModal}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive('link') ? 'bg-amber-500 text-white' : 'hover:bg-slate-200'
            }`}
            title="Insert Link (ਲਿੰਕ ਜੋੜੋ)"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition-colors ${
              editor.isActive('blockquote') ? 'bg-amber-500 text-white' : 'hover:bg-slate-200'
            }`}
            title="Blockquote (ਕਥਨ / ਕੋਟ)"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
            title="Horizontal Divider (ਲਾਈਨ)"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Group 9: Clear Formatting */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetAllMarks().clearNodes().run();
            }}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-rose-100 hover:text-rose-700 cursor-pointer transition-colors"
            title="Clear Formatting (ਫਾਰਮੈਟਿੰਗ ਹਟਾਓ)"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── RICH TEXT EDITOR CONTENT AREA ── */}
      <div className="p-4 sm:p-6 min-h-[360px] max-h-[640px] overflow-y-auto bg-amber-50/10 font-gurmukhi text-slate-900 text-lg leading-relaxed focus-within:outline-none cursor-text">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>

      {/* Insert Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 font-gurmukhi text-base flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-amber-600" />
                <span>ਲਿੰਕ ਦਰਜ ਕਰੋ (Insert / Edit Link)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetLink}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Save Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichNoteEditor;
