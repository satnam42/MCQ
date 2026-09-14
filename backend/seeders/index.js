const bcrypt = require('bcryptjs');
const { User, Topic, Subtopic, Question, Note } = require('../src/models');
const questionsDataset = require('./questionsDataset');
const { normalizePunjabiText } = require('../src/utils/normalizer');
const { parseTextToHtml, sanitizeHtmlContent } = require('../src/services/noteParserService');

async function seedDatabase() {
  try {
    console.log('🌱 Checking seed status...');

    // 1. Seed Users (Admin, Candidate, and Navjot Candidate)
    const adminEmail = 'admin@punjabi.com';
    let admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('Admin@12345', salt);
      admin = await User.create({
        name: 'Admin Lecturer Cadre',
        email: adminEmail,
        password_hash,
        role: 'admin',
      });
      console.log('👤 Admin user created: admin@punjabi.com / Admin@12345');
    }

    const candidateEmail = 'candidate@punjabi.com';
    let candidate = await User.findOne({ where: { email: candidateEmail } });
    if (!candidate) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('Candidate@12345', salt);
      candidate = await User.create({
        name: 'Punjabi Candidate',
        email: candidateEmail,
        password_hash,
        role: 'candidate',
      });
      console.log('👤 Candidate user created: candidate@punjabi.com / Candidate@12345');
    }

    // Seed Navjot user account
    const navjotEmail = 'navjot@gmail.com';
    let navjot = await User.findOne({ where: { email: navjotEmail } });
    if (!navjot) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('fundo@123', salt);
      navjot = await User.create({
        name: 'Navjot Singh',
        email: navjotEmail,
        password_hash,
        role: 'candidate',
      });
      console.log('👤 Candidate user created: navjot@gmail.com / fundo@123');
    } else {
      const salt = await bcrypt.genSalt(10);
      navjot.password_hash = await bcrypt.hash('fundo@123', salt);
      await navjot.save();
      console.log('👤 Verified user navjot@gmail.com password set to fundo@123');
    }

    // 2. Seed Standard Punjabi Literature Topics
    const standardTopics = [
      'ਭਾਈ ਵੀਰ ਸਿੰਘ',
      'ਧਨੀ ਰਾਮ ਚਾਤ੍ਰਿਕ',
      'ਪ੍ਰੋ. ਪੂਰਨ ਸਿੰਘ',
      'ਅੰਮ੍ਰਿਤਾ ਪ੍ਰੀਤਮ',
      'ਸ਼ਿਵ ਕੁਮਾਰ ਬਟਾਲਵੀ',
      'ਕਹਾਣੀਕਾਰ',
      'ਕਿੱਸਾ ਕਾਵਿ',
      'ਵਾਰ ਕਾਵਿ',
      'ਵਾਰਤਕ',
      'ਆਧੁਨਿਕ ਕਾਵਿ',
      'ਪੰਜਾਬੀ ਵਿਆਕਰਨ',
      'ਪੰਜਾਬੀ ਸਾਹਿਤ ਦਾ ਇਤਿਹਾਸ',
    ];

    for (const topicName of standardTopics) {
      let t = await Topic.findOne({ where: { name: topicName } });
      if (!t) {
        await Topic.create({
          name: topicName,
          description: `ਪੰਜਾਬੀ ਲੈਕਚਰਾਰ ਕੈਡਰ - ${topicName}`,
          is_active: true,
        });
      }
    }

    // 3. Seed Sample Note for Bhai Veer Singh if not present
    const bhaiVeerSinghTopic = await Topic.findOne({ where: { name: 'ਭਾਈ ਵੀਰ ਸਿੰਘ' } });
    if (bhaiVeerSinghTopic) {
      const noteCount = await Note.count({ where: { topic_id: bhaiVeerSinghTopic.id } });
      if (noteCount === 0) {
        const rawContent = `### ਭਾਈ ਵੀਰ ਸਿੰਘ

**ਜਨਮ/ਦੇਹਾਂਤ**

- ਜਨਮ: **5 ਦਸੰਬਰ 1872, ਅੰਮ੍ਰਿਤਸਰ**
- ਦੇਹਾਂਤ: **10 ਜੂਨ 1957**
- ਆਧੁਨਿਕ ਪੰਜਾਬੀ ਸਾਹਿਤ ਦੇ ਪ੍ਰਮੁੱਖ ਨਿਰਮਾਤਾ।

**Major/Most Important Work**

- **ਰਾਣਾ ਸੂਰਤ ਸਿੰਘ** (ਪ੍ਰਮੁੱਖ ਮਹਾਕਾਵਿ)

**Major Works**

- **ਸੁੰਦਰੀ** (ਪੰਜਾਬੀ ਦਾ ਪਹਿਲਾ ਨਾਵਲ)
- **ਬਿਜੈ ਸਿੰਘ**
- **ਸਤਵੰਤ ਕੌਰ**
- **ਬਾਬਾ ਨੌਧ ਸਿੰਘ**
- **ਮੇਰੇ ਸਾਈਆਂ ਜੀਓ**

**Awards**

- **ਸਾਹਿਤ ਅਕਾਦਮੀ ਪੁਰਸਕਾਰ – 1955**
- **ਪਦਮ ਭੂਸ਼ਣ – 1956**

**Literary Characteristics**

- ਸਿੱਖ ਧਾਰਮਿਕ ਚੇਤਨਾ ਅਤੇ ਇਤਿਹਾਸਕ ਚੇਤਨਾ
- ਆਧਿਆਤਮਿਕਤਾ ਅਤੇ ਕੁਦਰਤ ਪ੍ਰੇਮ
- ਆਧੁਨਿਕ ਪੰਜਾਬੀ ਸਾਹਿਤ ਦੇ ਪਿਤਾਮਾ

**Important Exam Facts**

- ਜਨਮ ਸਾਲ: **1872**
- ਦੇਹਾਂਤ ਸਾਲ: **1957**
- ਪਹਿਲੀ ਰਚਨਾ/ਨਾਵਲ: **ਸੁੰਦਰੀ**`;

        const htmlContent = sanitizeHtmlContent(parseTextToHtml(rawContent));
        await Note.create({
          topic_id: bhaiVeerSinghTopic.id,
          title: 'ਭਾਈ ਵੀਰ ਸਿੰਘ - ਜੀਵਨ ਅਤੇ ਰਚਨਾਵਾਂ',
          original_file_name: 'bhai_veer_singh_notes.txt',
          raw_content: rawContent,
          html_content: htmlContent,
          status: 'active',
          created_by: admin ? admin.id : null,
        });
        console.log('📝 Seeded initial study note for ਭਾਈ ਵੀਰ ਸਿੰਘ');
      }
    }


    // 4. Check if questions already exist
    const questionCount = await Question.count();
    if (questionCount > 0) {
      console.log(`ℹ️ Database already has ${questionCount} questions seeded. Skipping dataset seed.`);
      return;
    }

    console.log('🌱 Seeding Topics, Subtopics, and Punjabi MCQs dataset...');

    const topicMap = new Map();
    const subtopicMap = new Map();

    for (const item of questionsDataset) {
      let topic = topicMap.get(item.topic);
      if (!topic) {
        topic = await Topic.findOne({ where: { name: item.topic } });
        if (!topic) {
          topic = await Topic.create({
            name: item.topic,
            description: `ਪੰਜਾਬੀ ਲੈਕਚਰਾਰ ਕੈਡਰ - ${item.topic}`,
            is_active: true,
          });
        }
        topicMap.set(item.topic, topic);
      }

      let subtopicId = null;
      if (item.subtopic) {
        const subtopicKey = `${topic.id}_${item.subtopic}`;
        let subtopic = subtopicMap.get(subtopicKey);
        if (!subtopic) {
          subtopic = await Subtopic.findOne({ where: { topic_id: topic.id, name: item.subtopic } });
          if (!subtopic) {
            subtopic = await Subtopic.create({
              topic_id: topic.id,
              name: item.subtopic,
              description: item.subtopic,
            });
          }
          subtopicMap.set(subtopicKey, subtopic);
        }
        subtopicId = subtopic.id;
      }

      await Question.create({
        question: item.question,
        option_a: item.optionA,
        option_b: item.optionB,
        option_c: item.optionC,
        option_d: item.optionD,
        correct_option: item.correctOption,
        explanation: item.explanation || null,
        topic_id: topic.id,
        subtopic_id: subtopicId,
        difficulty: item.difficulty || 'medium',
        language: 'Punjabi',
        source: item.source || 'ਪੰਜਾਬੀ ਸਾਹਿਤ ਪ੍ਰਮਾਣਿਕ ਸਮੱਗਰੀ',
        is_verified: true,
        is_active: true,
        normalized_text: normalizePunjabiText(item.question),
      });
    }

    const totalInserted = await Question.count();
    console.log(`✅ Seeded ${totalInserted} authentic Punjabi MCQs successfully!`);
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
}

if (require.main === module) {
  const { sequelize } = require('../src/models');
  const isMysql = process.env.DB_DIALECT === 'mysql';
  sequelize.sync(isMysql ? { alter: true } : {}).then(() => {
    seedDatabase().then(() => process.exit(0));
  });
}

module.exports = seedDatabase;

