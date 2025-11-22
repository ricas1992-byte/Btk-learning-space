import formidable from 'formidable';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // הגדר CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({ multiples: false });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const docxFile = files.file?.[0];
    if (!docxFile) {
      return res.status(400).json({ error: 'לא נבחר קובץ' });
    }

    const title = fields.title?.[0];
    if (!title) {
      return res.status(400).json({ error: 'שם הקורס חובה' });
    }

    const description = fields.description?.[0] || '';
    const language = fields.language?.[0] || 'he';
    const tags = fields.tags?.[0]?.split(',').map(t => t.trim()).filter(Boolean) || [];

    // קרא DOCX
    const buffer = await fs.readFile(docxFile.filepath);
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;

    // פרסר HTML ליחידות (לפי h2)
    const lessons = parseHTMLtoLessons(html);

    // צור אובייקט קורס
    const course = {
      id: uuidv4(),
      title,
      description,
      language,
      tags,
      createdAt: new Date().toISOString(),
      lessons,
    };

    // שמור JSON
    const coursesDir = path.join(process.cwd(), 'public', 'courses');
    await fs.mkdir(coursesDir, { recursive: true });

    const coursePath = path.join(coursesDir, `${course.id}.json`);
    await fs.writeFile(coursePath, JSON.stringify(course, null, 2));

    // עדכן אינדקס קורסים
    await updateCoursesIndex(course, coursesDir);

    res.status(200).json({ success: true, courseId: course.id });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process course', details: error.message });
  }
}

/**
 * פרסר HTML ליחידות לימוד
 */
function parseHTMLtoLessons(html) {
  const lessons = [];

  // חלק לפי <h2>
  const sections = html.split(/<h2[^>]*>/i);

  sections.slice(1).forEach((section, index) => {
    const titleEnd = section.indexOf('</h2>');
    if (titleEnd === -1) return;

    const title = section.substring(0, titleEnd).trim();
    const content = '<h2>' + section;

    // הסר תגי HTML לטקסט נקי
    const textContent = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    lessons.push({
      id: `lesson-${index + 1}`,
      title,
      order: index + 1,
      contentHtml: content,
      contentText: textContent,
    });
  });

  // אם לא נמצאו h2, צור יחידה אחת עם כל התוכן
  if (lessons.length === 0) {
    const textContent = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    lessons.push({
      id: 'lesson-1',
      title: 'יחידה 1',
      order: 1,
      contentHtml: html,
      contentText: textContent,
    });
  }

  return lessons;
}

/**
 * עדכן אינדקס קורסים
 */
async function updateCoursesIndex(course, coursesDir) {
  const indexPath = path.join(coursesDir, 'index.json');

  let index = [];
  try {
    const data = await fs.readFile(indexPath, 'utf-8');
    index = JSON.parse(data);
  } catch (err) {
    // אין קובץ - ניצור חדש
  }

  index.push({
    id: course.id,
    title: course.title,
    description: course.description,
    language: course.language,
    tags: course.tags,
    createdAt: course.createdAt,
    lessonCount: course.lessons.length,
  });

  await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
}
