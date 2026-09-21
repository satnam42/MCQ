const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Topic, Note } = require('../src/models');
const { parseTextToHtml, sanitizeHtmlContent } = require('../src/services/noteParserService');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../src/config/jwt');
const { seedTestPermissions } = require('./helpers/seedTestPermissions');

describe('Notes Management System Backend Tests', () => {
  let adminToken;
  let candidateToken;
  let topic;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await seedTestPermissions();

    // Create Admin user
    const admin = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password_hash: 'hashedpassword',
      role: 'admin',
    });
    adminToken = jwt.sign({ id: admin.id, role: admin.role }, jwtConfig.secret);

    // Create Candidate user
    const candidate = await User.create({
      name: 'Test Candidate',
      email: 'candidate@test.com',
      password_hash: 'hashedpassword',
      role: 'candidate',
    });
    candidateToken = jwt.sign({ id: candidate.id, role: candidate.role }, jwtConfig.secret);

    // Create initial Topic
    topic = await Topic.create({
      name: 'ਭਾਈ ਵੀਰ ਸਿੰਘ',
      description: 'ਸਾਹਿਤਕਾਰ ਭਾਈ ਵੀਰ ਸਿੰਘ ਨੋਟਸ',
      is_active: true,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Text to HTML Parser Unit Tests', () => {
    test('converts top heading to <h1 class="notes-main-title">', () => {
      const input = '### ਭਾਈ ਵੀਰ ਸਿੰਘ';
      const output = parseTextToHtml(input);
      expect(output).toContain('<h1 class="notes-main-title">ਭਾਈ ਵੀਰ ਸਿੰਘ</h1>');
    });

    test('converts standalone section heading to study card with <h2 class="notes-section-title">', () => {
      const input = '### ਭਾਈ ਵੀਰ ਸਿੰਘ\n\n**ਜਨਮ/ਦੇਹਾਂਤ**';
      const output = parseTextToHtml(input);
      expect(output).toContain('<h1 class="notes-main-title">ਭਾਈ ਵੀਰ ਸਿੰਘ</h1>');
      expect(output).toContain('<section class="notes-section-card">');
      expect(output).toContain('notes-section-title');
      expect(output).toContain('ਜਨਮ/ਦੇਹਾਂਤ');
    });

    test('converts bullet points into <ul class="notes-list"><li> list', () => {
      const input = `- ਜਨਮ: **5 ਦਸੰਬਰ 1872**\n- ਦੇਹਾਂਤ: **10 ਜੂਨ 1957**`;
      const output = parseTextToHtml(input);
      expect(output).toContain('<ul class="notes-list">');
      expect(output).toContain('<li>ਜਨਮ: <strong>5 ਦਸੰਬਰ 1872</strong></li>');
      expect(output).toContain('<li>ਦੇਹਾਂਤ: <strong>10 ਜੂਨ 1957</strong></li>');
      expect(output).toContain('</ul>');
    });

    test('sanitizes script tags from HTML', () => {
      const maliciousHtml = '<h1 class="notes-main-title">Title</h1><script>alert("xss")</script><p>Clean content</p>';
      const sanitized = sanitizeHtmlContent(maliciousHtml);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<h1 class="notes-main-title">Title</h1>');
      expect(sanitized).toContain('<p>Clean content</p>');
    });
  });

  describe('File Validation & Notes API Integration Tests', () => {
    test('Rejects non-.txt file upload (PDF)', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('topicId', topic.id)
        .field('title', 'Invalid PDF Note')
        .attach('file', Buffer.from('PDF file content'), 'notes.pdf');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only .txt and .json files are allowed');
    });

    test('Rejects empty file upload (0 bytes)', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('topicId', topic.id)
        .field('title', 'Empty File Note')
        .attach('file', Buffer.from(''), 'empty.txt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('empty');
    });

    test('Successfully uploads and parses valid .txt note file', async () => {
      const txtContent = `### ਭਾਈ ਵੀਰ ਸਿੰਘ\n\n**ਜਨਮ/ਦੇਹਾਂਤ**\n\n- ਜਨਮ: **5 ਦਸੰਬਰ 1872**`;

      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('topicId', topic.id)
        .field('title', 'ਭਾਈ ਵੀਰ ਸਿੰਘ ਨੋਟਸ')
        .attach('file', Buffer.from(txtContent, 'utf-8'), 'bhai_veer_singh.txt');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.note).toBeDefined();
      expect(res.body.data.note.title).toBe('ਭਾਈ ਵੀਰ ਸਿੰਘ ਨੋਟਸ');
      expect(res.body.data.note.html_content).toContain('<h1 class="notes-main-title">ਭਾਈ ਵੀਰ ਸਿੰਘ</h1>');
      expect(res.body.data.note.html_content).toContain('notes-section-title');
      expect(res.body.data.note.html_content).toContain('ਜਨਮ/ਦੇਹਾਂਤ');
    });

    test('Allows Preview parsing without saving to database', async () => {
      const txtContent = `**ਸਾਹਿਤਕ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ**\n- ਸਿੱਖ ਧਾਰਮਿਕ ਚੇਤਨਾ`;

      const res = await request(app)
        .post('/api/notes/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(txtContent, 'utf-8'), 'preview.txt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.htmlContent).toContain('notes-main-title');
      expect(res.body.data.htmlContent).toContain('ਸਾਹਿਤਕ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ');
    });

    test('Candidates can retrieve active notes', async () => {
      const res = await request(app)
        .get(`/api/notes?topicId=${topic.id}`)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.notes)).toBe(true);
      expect(res.body.data.notes.length).toBeGreaterThan(0);
    });

    test('Admin can update a note', async () => {
      const notesList = await Note.findAll();
      const targetNoteId = notesList[0].id;

      const res = await request(app)
        .put(`/api/notes/${targetNoteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'ਭਾਈ ਵੀਰ ਸਿੰਘ - ਅਪਡੇਟਿਡ' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.note.title).toBe('ਭਾਈ ਵੀਰ ਸਿੰਘ - ਅਪਡੇਟਿਡ');
    });

    test('Admin can delete a note', async () => {
      const notesList = await Note.findAll();
      const targetNoteId = notesList[0].id;

      const res = await request(app)
        .delete(`/api/notes/${targetNoteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
