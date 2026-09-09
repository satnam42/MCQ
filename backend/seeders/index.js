const bcrypt = require('bcryptjs');
const { User, Topic, Subtopic, Question } = require('../src/models');
const questionsDataset = require('./questionsDataset');
const { normalizePunjabiText } = require('../src/utils/normalizer');

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
      // Ensure password match for existing navjot record
      const salt = await bcrypt.genSalt(10);
      navjot.password_hash = await bcrypt.hash('fundo@123', salt);
      await navjot.save();
      console.log('👤 Verified user navjot@gmail.com password set to fundo@123');
    }

    // 2. Check if questions already exist
    const questionCount = await Question.count();
    if (questionCount > 0) {
      console.log(`ℹ️ Database already has ${questionCount} questions seeded. Skipping dataset seed.`);
      return;
    }

    console.log('🌱 Seeding Topics, Subtopics, and Punjabi MCQs dataset...');

    const topicMap = new Map();
    const subtopicMap = new Map();

    for (const item of questionsDataset) {
      // Find or create Topic
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

      // Find or create Subtopic
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

      // Create Question
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
