const duplicateDetectorService = require('../src/services/duplicateDetectorService');
const { normalizePunjabiText } = require('../src/utils/normalizer');

describe('Duplicate Detector & Normalizer Unit Tests', () => {
  test('normalizePunjabiText removes punctuation and extra spaces', () => {
    const raw = '  ਬੁੱਲ੍ਹੇ ਸ਼ਾਹ  ਕਿਸ ਸਾਹਿਤਕ ਧਾਰਾ ਨਾਲ... ਸੰਬੰਧਿਤ ਹਨ? ॥  ';
    const normalized = normalizePunjabiText(raw);
    expect(normalized).toBe('ਬੁੱਲ੍ਹੇ ਸ਼ਾਹ ਕਿਸ ਸਾਹਿਤਕ ਧਾਰਾ ਨਾਲ ਸੰਬੰਧਿਤ ਹਨ');
  });

  test('calculateSimilarity returns 1.0 for identical strings', () => {
    const sim = duplicateDetectorService.calculateSimilarity(
      'ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਦੀ ਲਿਪੀ ਗੁਰਮੁਖੀ ਹੈ',
      'ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਦੀ ਲਿਪੀ ਗੁਰਮੁਖੀ ਹੈ'
    );
    expect(sim).toBe(1.0);
  });

  test('calculateSimilarity detects high similarity with minor wording variations', () => {
    const s1 = 'ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਦੀ ਲਿਪੀ ਗੁਰਮੁਖੀ ਹੈ ਅਤੇ ਇਹ ਪੰਜਾਬ ਵਿੱਚ ਬੋਲੀ ਜਾਂਦੀ ਹੈ';
    const s2 = 'ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਦੀ ਲਿਪੀ ਗੁਰਮੁਖੀ ਹੈ ਅਤੇ ਇਹ ਪੰਜਾਬ ਵਿਚ ਬੋਲੀ ਜਾਂਦੀ ਹੈ';
    const sim = duplicateDetectorService.calculateSimilarity(s1, s2);
    expect(sim).toBeGreaterThan(0.90);
  });
});
