const { parseTextToHtml, sanitizeHtmlContent } = require('../src/services/noteParserService');

describe('Rich Notes Structured JSON Parser Service', () => {
  it('should convert structured doc JSON to clean HTML with Punjabi text', () => {
    const jsonDoc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [
            {
              type: 'text',
              text: 'ਭਾਈ ਵੀਰ ਸਿੰਘ',
              marks: [{ type: 'bold' }],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'ਜਨਮ: ',
              marks: [{ type: 'bold' }],
            },
            {
              type: 'text',
              text: '5 ਦਸੰਬਰ 1872',
              marks: [{ type: 'textStyle', attrs: { color: '#b45309', fontSize: '20px' } }],
            },
          ],
        },
      ],
    };

    const html = parseTextToHtml(jsonDoc);
    expect(html).toContain('ਭਾਈ ਵੀਰ ਸਿੰਘ');
    expect(html).toContain('5 ਦਸੰਬਰ 1872');
    expect(html).toContain('color: #b45309');
    expect(html).toContain('font-size: 20px');
  });

  it('should convert JSON string representations automatically', () => {
    const jsonStr = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            {
              type: 'text',
              text: 'ਸਾਹਿਤ ਮਨੁੱਖੀ ਜੀਵਨ ਦਾ ਦਰਪਣ ਹੈ।',
            },
          ],
        },
      ],
    });

    const html = parseTextToHtml(jsonStr);
    expect(html).toContain('<blockquote');
    expect(html).toContain('ਸਾਹਿਤ ਮਨੁੱਖੀ ਜੀਵਨ ਦਾ ਦਰਪਣ ਹੈ।');
  });

  it('should sanitize dangerous script tags and javascript URLs', () => {
    const dangerousHtml = '<p>Test</p><script>alert("xss")</script><a href="javascript:alert(1)">Link</a>';
    const sanitized = sanitizeHtmlContent(dangerousHtml);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('javascript:');
  });

  it('should support legacy plain text markdown fallback', () => {
    const legacyText = '### ਅੰਮ੍ਰਿਤਾ ਪ੍ਰੀਤਮ\n\n- ਜਨਮ: **31 ਅਗਸਤ 1919**';
    const html = parseTextToHtml(legacyText);
    expect(html).toContain('ਅੰਮ੍ਰਿਤਾ ਪ੍ਰੀਤਮ');
    expect(html).toContain('<strong>31 ਅਗਸਤ 1919</strong>');
  });
});
