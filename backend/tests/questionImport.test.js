const questionImportService = require('../src/services/questionImportService');
const { sequelize, Question, Topic } = require('../src/models');
const seedDatabase = require('../seeders/index');

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await seedDatabase();
});

describe('Question Import Service (CSV & JSON) Unit Tests', () => {
  test('QuestionImportService processes CSV file records, skips existing DB records, and adds next new records', async () => {
    let topic = await Topic.findOne();
    const existingQ = await Question.create({
      question: 'ਪੰਜਾਬੀ ਨਾਵਲ ਇੱਕ ਦੁਨੀਆ ਸਭ ਤੋਂ ਸੁੰਦਰ ਦੇ ਲੇਖਕ ਕੌਣ ਹਨ (ਪ੍ਰਮਾਣਿਕ)?',
      option_a: 'ਲੇਖਕ ਏ',
      option_b: 'ਲੇਖਕ ਬੀ',
      option_c: 'ਲੇਖਕ ਸੀ',
      option_d: 'ਲੇਖਕ ਡੀ',
      correct_option: 'A',
      explanation: 'ਸੁਤੰਤਰ ਸਮਝ',
      topic_id: topic.id,
      difficulty: 'medium',
      language: 'Punjabi',
      source: 'ਸਾਹਿਤ ਇਤਿਹਾਸ',
      is_verified: true,
      is_active: true,
      normalized_text: 'ਪੰਜਾਬੀ ਨਾਵਲ ਇੱਕ ਦੁਨੀਆ ਸਭ ਤੋਂ ਸੁੰਦਰ ਦੇ ਲੇਖਕ ਕੌਣ ਹਨ ਪ੍ਰਮਾਣਿਕ',
    });

    const csvData = `question,optionA,optionB,optionC,optionD,correctOption,explanation,topic,difficulty,source
"ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਦੀ ਉਤਪੱਤੀ ਕਿਸ ਨਾਲ ਹੋਈ (ਨਵਾਂ-1)?","ਵੈਦਿਕ ਸੰਸਕ੍ਰਿਤ","ਪ੍ਰਾਕ੍ਰਿਤ","ਅਪਭ੍ਰੰਸ਼","ਅਰਬੀ","C","ਪੰਜਾਬੀ ਦੀ ਉਤਪੱਤੀ ਸ਼ੋਰਸੇਨੀ ਅਪਭ੍ਰੰਸ਼ ਤੋਂ ਹੋਈ।","ਪੰਜਾਬੀ ਭਾਸ਼ਾ","easy","ਭਾਸ਼ਾ ਵਿਗਿਆਨ"
"ਪੰਜਾਬੀ ਨਾਵਲ ਇੱਕ ਦੁਨੀਆ ਸਭ ਤੋਂ ਸੁੰਦਰ ਦੇ ਲੇਖਕ ਕੌਣ ਹਨ (ਪ੍ਰਮਾਣਿਕ)?","ਲੇਖਕ ਏ","ਲੇਖਕ ਬੀ","ਲੇਖਕ ਸੀ","ਲੇਖਕ ਡੀ","A","ਸੁਤੰਤਰ ਸਮਝ","ਸਾਹਿਤ ਇਤਿਹਾਸ","medium","ਸਾਹਿਤ ਇਤਿਹਾਸ"
"ਪੰਜਾਬੀ ਸੂਫ਼ੀ ਕਵੀ ਬੁੱਲ੍ਹੇ ਸ਼ਾਹ ਦੀਆਂ ਕਾਫ਼ੀਆਂ ਕਿੰਨੀਆਂ ਹਨ (ਨਵਾਂ-3)?","156","110","50","200","A","ਬੁੱਲ੍ਹੇ ਸ਼ਾਹ ਦੀਆਂ 156 ਕਾਫ਼ੀਆਂ ਮਿਲਦੀਆਂ ਹਨ।","ਸੂਫ਼ੀ ਸਾਹਿਤ","tough","ਸੂਫ਼ੀ ਕਾਵਿ"`;

    const buffer = Buffer.from(csvData, 'utf-8');
    const result = await questionImportService.importQuestionsFromCSVBuffer(buffer);

    expect(result.totalRows).toBe(3);
    expect(result.successful).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.duplicates).toBe(1);
  });

  test('QuestionImportService imports JSON string copy-pasted into text area', async () => {
    const jsonText = JSON.stringify([
      {
        question: "ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦੀਆਂ ਬਾਣੀਆਂ ਕਿੰਨੇ ਰਾਗਾਂ ਵਿੱਚ ਹਨ (JSON-1)?",
        optionA: "19",
        optionB: "31",
        optionC: "17",
        optionD: "22",
        correctOption: "A",
        explanation: "ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦੀ ਬਾਣੀ 19 ਰਾਗਾਂ ਵਿੱਚ ਦਰਜ ਹੈ।",
        topic: "ਗੁਰਮਤਿ ਸਾਹਿਤ",
        difficulty: "easy"
      },
      {
        question: "ਵਾਰਿਸ ਸ਼ਾਹ ਦਾ ਕਿੱਸਾ ਹੀਰ ਕਿਸ ਛੰਦ ਵਿੱਚ ਲਿਖਿਆ ਗਿਆ ਹੈ (JSON-2)?",
        optionA: "ਦੋਹਰਾ",
        optionB: "ਬੈਂਤ",
        optionC: "ਕਬਿੱਤ",
        optionD: "ਸੋਰਠਾ",
        correctOption: "B",
        explanation: "ਵਾਰਿਸ ਸ਼ਾਹ ਨੇ ਹੀਰ ਦਾ ਕਿੱਸਾ ਬੈਂਤ ਛੰਦ ਵਿੱਚ ਰਚਿਆ ਹੈ।",
        topic: "ਕਿੱਸਾ ਸਾਹਿਤ",
        difficulty: "medium"
      }
    ]);

    const result = await questionImportService.importQuestionsFromJSON(jsonText);

    expect(result.totalRows).toBe(2);
    expect(result.successful).toBe(2);
    expect(result.skipped).toBe(0);

    const inserted = await Question.findOne({ where: { question: "ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦੀਆਂ ਬਾਣੀਆਂ ਕਿੰਨੇ ਰਾਗਾਂ ਵਿੱਚ ਹਨ (JSON-1)?" } });
    expect(inserted).toBeDefined();
    expect(inserted.correct_option).toBe('A');
  });
});
