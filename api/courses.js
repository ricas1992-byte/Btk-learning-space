import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  // הגדר CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { courseId } = req.query;

  try {
    const coursesDir = path.join(process.cwd(), 'public', 'courses');

    if (courseId) {
      // טען קורס ספציפי
      const coursePath = path.join(coursesDir, `${courseId}.json`);

      try {
        const data = await fs.readFile(coursePath, 'utf-8');
        res.status(200).json(JSON.parse(data));
      } catch (error) {
        res.status(404).json({ error: 'Course not found' });
      }
    } else {
      // טען רשימת קורסים
      const indexPath = path.join(coursesDir, 'index.json');

      try {
        const data = await fs.readFile(indexPath, 'utf-8');
        res.status(200).json(JSON.parse(data));
      } catch (error) {
        // אם אין index, החזר מערך רק
        res.status(200).json([]);
      }
    }
  } catch (error) {
    console.error('Courses API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
