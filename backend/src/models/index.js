const { sequelize } = require('../config/database');
const Permission = require('./Permission');
const Role = require('./Role');
const RolePermission = require('./RolePermission');
const User = require('./User');
const Topic = require('./Topic');
const Subtopic = require('./Subtopic');
const Question = require('./Question');
const DailyQuiz = require('./DailyQuiz');
const DailyQuizQuestion = require('./DailyQuizQuestion');
const TestAttempt = require('./TestAttempt');
const TestAnswer = require('./TestAnswer');
const Note = require('./Note');
const UserAnsweredQuestion = require('./UserAnsweredQuestion');
const SystemSetting = require('./SystemSetting');
const UserContentView = require('./UserContentView');
const RoleTestLimit = require('./RoleTestLimit');
const UserTestLimit = require('./UserTestLimit');

// Topic & Subtopic
Topic.hasMany(Subtopic, { foreignKey: 'topic_id', as: 'subtopics', onDelete: 'CASCADE' });
Subtopic.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

// Topic & Question
Topic.hasMany(Question, { foreignKey: 'topic_id', as: 'questions' });
Question.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

// Subtopic & Question
Subtopic.hasMany(Question, { foreignKey: 'subtopic_id', as: 'questions' });
Question.belongsTo(Subtopic, { foreignKey: 'subtopic_id', as: 'subtopic' });

// Topic & Note
Topic.hasMany(Note, { foreignKey: 'topic_id', as: 'notes', onDelete: 'CASCADE' });
Note.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

// User & Note
User.hasMany(Note, { foreignKey: 'created_by', as: 'notes', onDelete: 'SET NULL' });
Note.belongsTo(User, { foreignKey: 'created_by', as: 'author' });

// User & UserAnsweredQuestion
User.hasMany(UserAnsweredQuestion, { foreignKey: 'user_id', as: 'userAnsweredQuestions', onDelete: 'CASCADE' });
UserAnsweredQuestion.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Question & UserAnsweredQuestion
Question.hasMany(UserAnsweredQuestion, { foreignKey: 'question_id', as: 'userAnsweredQuestions', onDelete: 'CASCADE' });
UserAnsweredQuestion.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// Topic & UserAnsweredQuestion
Topic.hasMany(UserAnsweredQuestion, { foreignKey: 'topic_id', as: 'userAnsweredQuestions', onDelete: 'SET NULL' });
UserAnsweredQuestion.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

// User & UserContentView
User.hasMany(UserContentView, { foreignKey: 'user_id', as: 'userContentViews', onDelete: 'CASCADE' });
UserContentView.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

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

// Role & Permission (Many-to-Many through RolePermission)
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'permission_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', otherKey: 'role_id', as: 'roles' });

Role.hasMany(RolePermission, { foreignKey: 'role_id', as: 'rolePermissions' });
RolePermission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

Permission.hasMany(RolePermission, { foreignKey: 'permission_id', as: 'rolePermissions' });
RolePermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission' });

// Role & RoleTestLimit
Role.hasMany(RoleTestLimit, { foreignKey: 'role_id', as: 'testLimits' });
RoleTestLimit.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// User & UserTestLimit
User.hasMany(UserTestLimit, { foreignKey: 'user_id', as: 'testLimitOverrides' });
UserTestLimit.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  Permission,
  Role,
  RolePermission,
  User,
  Topic,
  Subtopic,
  Question,
  DailyQuiz,
  DailyQuizQuestion,
  TestAttempt,
  TestAnswer,
  Note,
  UserAnsweredQuestion,
  SystemSetting,
  UserContentView,
  RoleTestLimit,
  UserTestLimit,
};


