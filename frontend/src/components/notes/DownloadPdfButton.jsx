import React, { useState } from 'react';
import { Printer, CheckCircle } from 'lucide-react';

/**
 * Generate clean filename slug for note PDF
 */
function getCleanPdfFilename(title, topicName) {
  const baseName = title || topicName || 'punjabi-notes';

  const translitMap = {
    'ਭਾਈ': 'bhai',
    'ਵੀਰ': 'veer',
    'ਸਿੰਘ': 'singh',
    'ਧਨੀ': 'dhani',
    'ਰਾਮ': 'ram',
    'ਚਾਤ੍ਰਿਕ': 'chatrik',
    'ਪ੍ਰੋ': 'pro',
    'ਪੂਰਨ': 'puran',
    'ਅੰਮ੍ਰਿਤਾ': 'amrita',
    'ਪ੍ਰੀਤਮ': 'pritam',
    'ਸ਼ਿਵ': 'shiv',
    'ਕੁਮਾਰ': 'kumar',
    'ਬਟਾਲਵੀ': 'batalvi',
    'ਨੋਟਸ': 'notes',
  };

  let clean = baseName;
  Object.keys(translitMap).forEach((key) => {
    clean = clean.replaceAll(key, translitMap[key]);
  });

  clean = clean
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-');

  if (!clean) {
    clean = 'punjabi-study-notes';
  }

  return `${clean}-notes.pdf`;
}

const DownloadPdfButton = ({ note, topicName }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handlePrintPdf = () => {
    if (!note) return;
    setIsGenerating(true);

    const filename = getCleanPdfFilename(
      note.title,
      topicName || (note.topic ? note.topic.name : '')
    );

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Popup blocked. Please allow popups to download/print PDF.');
        setIsGenerating(false);
        return;
      }

      const noteHtml = note.html_content || note.htmlContent || '';
      const topicTitle = topicName || (note.topic ? note.topic.name : 'ਪੰਜਾਬੀ ਸਾਹਿਤ');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pa">
        <head>
          <meta charset="UTF-8">
          <title>${note.title || 'Punjabi Notes'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gurmukhi:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4;
              margin: 15mm 15mm 20mm 15mm;
            }
            body {
              font-family: 'Noto Sans Gurmukhi', 'Nirmala UI', 'Raavi', sans-serif;
              color: #1e293b;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
            }
            .header-banner {
              border-bottom: 3px solid #d97706;
              padding-bottom: 12px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .header-title {
              font-size: 24px;
              font-weight: 800;
              color: #78350f;
              margin: 0 0 6px 0;
            }
            .header-topic {
              font-size: 13px;
              font-weight: 700;
              color: #b45309;
              background-color: #fef3c7;
              padding: 3px 10px;
              border-radius: 20px;
              display: inline-block;
            }
            .header-right {
              text-align: right;
              font-size: 11px;
              color: #64748b;
            }
            .notes-main-title {
              font-size: 22px;
              font-weight: 800;
              color: #78350f;
              margin-top: 16px;
              margin-bottom: 16px;
              border-bottom: 2px solid #d97706;
              padding-bottom: 6px;
            }
            .notes-section-title, h2 {
              font-size: 1.35rem;
              font-weight: 800;
              color: #78350f;
              margin-top: 24px;
              margin-bottom: 12px;
              border-bottom: 2px solid #fde68a;
              padding-bottom: 6px;
              display: block;
            }
            .notes-subsection-title, h3 {
              font-size: 1.2rem;
              font-weight: 800;
              color: #92400e;
              background-color: #fef3c7;
              padding: 6px 14px;
              border-radius: 8px;
              border-left: 4px solid #d97706;
              display: inline-block;
              margin-top: 20px;
              margin-bottom: 12px;
            }
            .notes-list, ul {
              list-style: none;
              padding-left: 0;
              margin-top: 10px;
              margin-bottom: 20px;
            }
            .notes-list li, ul li {
              position: relative;
              padding-left: 26px;
              margin-bottom: 10px;
              font-size: 1.05rem;
              color: #1e293b;
              line-height: 1.65;
              font-weight: 500;
            }
            .notes-list li::before, ul li::before {
              content: "★";
              position: absolute;
              left: 0;
              top: 0;
              color: #d97706;
              font-weight: 800;
              font-size: 1.15rem;
            }
            strong {
              font-weight: 700;
              color: #0f172a;
            }
            p {
              font-size: 1.05rem;
              margin-top: 8px;
              margin-bottom: 12px;
              color: #334155;
            }
            .footer-note {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
              font-size: 10px;
              color: #94a3b8;
              text-align: center;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div>
              <span class="header-topic">${topicTitle}</span>
              <h1 class="header-title">${note.title}</h1>
            </div>
            <div class="header-right">
              <strong>ਪੰਜਾਬੀ ਲੈਕਚਰਾਰ ਕੈਡਰ ਨੋਟਸ</strong><br/>
              Punjabi Preparation Material
            </div>
          </div>

          <article class="notes-container">
            ${noteHtml}
          </article>

          <div class="footer-note">
            Punjabi Lecturer Preparation Platform • Document File: ${filename}
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (err) {
      console.error('Error generating PDF view:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrintPdf}
      disabled={isGenerating}
      className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md ${
        isDone
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
          : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200'
      } cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed`}
      title="Save or Download PDF"
    >
      {isDone ? (
        <>
          <CheckCircle className="w-4 h-4 text-white" />
          <span>ਤਿਆਰ ਹੋ ਗਿਆ!</span>
        </>
      ) : (
        <>
          <Printer className="w-4 h-4 text-amber-700" />
          <span className="font-gurmukhi font-bold">📄 Download PDF</span>
        </>
      )}
    </button>
  );
};

export default DownloadPdfButton;
