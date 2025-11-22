import formidable from 'formidable';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { put, list } from '@vercel/blob';
import fs from 'fs/promises';

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
    return res.status(405).json({ error: 'שיטת HTTP לא מורשית' });
  }

  try {
    // פרסר FormData
    const form = formidable({ multiples: false });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // בדוק קובץ
    const docxFile = files.file?.[0];
    if (!docxFile) {
      return res.status(400).json({ error: 'לא נבחר קובץ' });
    }

    // בדוק שם קורס
    const title = fields.title?.[0];
    if (!title) {
      return res.status(400).json({ error: 'שם הקורס חובה' });
    }

    const description = fields.description?.[0] || '';
    const language = fields.language?.[0] || 'he';
    const tags = fields.tags?.[0]?.split(',').map(t => t.trim()).filter(Boolean) || [];

    // קרא DOCX והמר ל-HTML
    const buffer = await fs.readFile(docxFile.filepath);
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;

    // פרק HTML ליחידות לימוד (לפי h2)
    const lessons = parseHTMLtoLessons(html);

    // צור אובייקט קורס
    const courseId = uuidv4();
    const course = {
      id: courseId,
      title,
      description,
      language,
      tags,
      createdAt: new Date().toISOString(),
      lessons,
    };

    // שמור את הקורס ב-Vercel Blob Storage
    const courseBlob = await put(`courses/${courseId}.json`, JSON.stringify(course, null, 2), {
      access: 'public',
      addRandomSuffix: false,
    });

    // עדכן אינדקס קורסים
    await updateCoursesIndex(course);

    res.status(200).json({
      success: true,
      courseId: course.id,
      message: 'הקורס הועלה בהצלחה'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'כשל בעיבוד הקורס',
      details: error.message
    });
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
 * עדכן אינדקס קורסים ב-Vercel Blob Storage
 */
async function updateCoursesIndex(course) {
  let index = [];

  try {
    // קרא index קיים
    const { blobs } = await list({ prefix: 'courses/index.json' });

    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url);
      index = await response.json();
    }
  } catch (err) {
    console.log('No existing index, creating new one');
  }

  // הוסף קורס חדש לאינדקס
  index.push({
    id: course.id,
    title: course.title,
    description: course.description,
    language: course.language,
    tags: course.tags,
    createdAt: course.createdAt,
    lessonCount: course.lessons.length,
  });

  // שמור אינדקס מעודכן
  await put('courses/index.json', JSON.stringify(index, null, 2), {
    access: 'public',
    addRandomSuffix: false,
  });
}
