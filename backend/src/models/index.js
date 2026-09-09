const { sequelize } = require('../config/database');
const User = require('./User');
const Topic = require('./Topic');
const Subtopic = require('./Subtopic');
const Question = require('./Question');
const DailyQuiz = require('./DailyQuiz');
const DailyQuizQuestion = require('./DailyQuizQuestion');
const TestAttempt = require('./TestAttempt');
const TestAnswer = require('./TestAnswer');

// Topic & Subtopic
Topic.hasMany(Subtopic, { foreignKey: 'topic_id', as: 'subtopics', onDelete: 'CASCADE' });
Subtopic.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

// Topic & Question
Topic.hasMany(Question, { foreignKey: 'topic_id', as: 'questions' });
Question.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

// Subtopic & Question
Subtopic.hasMany(Question, { foreignKey: 'subtopic_id', as: 'questions' });
Question.belongsTo(Subtopic, { foreignKey: 'subtopic_id', as: 'subtopic' });

// DailyQuiz & Question (through DailyQuizQuestion)
DailyQuiz.belongsToMany(Question, {
  through: DailyQuizQuestion,
  foreignKey: 'daily_quiz_id',
  otherKey: 'question_id',
  as: 'questions',
});
Question.belongsToMany(DailyQuiz, {
  through: DailyQuizQuestion,
  foreignKey: 'question_id',
  otherKey: 'daily_quiz_id',
  as: 'dailyQuizzes',
});

DailyQuiz.hasMany(DailyQuizQuestion, { foreignKey: 'daily_quiz_id', as: 'quizQuestions' });
DailyQuizQuestion.belongsTo(DailyQuiz, { foreignKey: 'daily_quiz_id', as: 'dailyQuiz' });

DailyQuizQuestion.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });
Question.hasMany(DailyQuizQuestion, { foreignKey: 'question_id', as: 'quizQuestions' });

// User & TestAttempt
User.hasMany(TestAttempt, { foreignKey: 'user_id', as: 'testAttempts', onDelete: 'CASCADE' });
TestAttempt.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// DailyQuiz & TestAttempt
DailyQuiz.hasMany(TestAttempt, { foreignKey: 'daily_quiz_id', as: 'attempts' });
TestAttempt.belongsTo(DailyQuiz, { foreignKey: 'daily_quiz_id', as: 'dailyQuiz' });

// Topic & TestAttempt
Topic.hasMany(TestAttempt, { foreignKey: 'topic_id', as: 'attempts' });
TestAttempt.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

// TestAttempt & TestAnswer
TestAttempt.hasMany(TestAnswer, { foreignKey: 'attempt_id', as: 'answers', onDelete: 'CASCADE' });
TestAnswer.belongsTo(TestAttempt, { foreignKey: 'attempt_id', as: 'attempt' });

// Question & TestAnswer
Question.hasMany(TestAnswer, { foreignKey: 'question_id', as: 'testAnswers' });
TestAnswer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

module.exports = {
  sequelize,
  User,
  Topic,
  Subtopic,
  Question,
  DailyQuiz,
  DailyQuizQuestion,
  TestAttempt,
  TestAnswer,
};
