import { list } from '@vercel/blob';

export default async function handler(req, res) {
  // הגדר CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'שיטת HTTP לא מורשית' });
  }

  const { courseId } = req.query;

  try {
    if (courseId) {
      // טען קורס ספציפי מ-Vercel Blob Storage
      const { blobs } = await list({ prefix: `courses/${courseId}.json` });

      if (blobs.length === 0) {
        return res.status(404).json({ error: 'הקורס לא נמצא' });
      }

      try {
        const response = await fetch(blobs[0].url);
        const course = await response.json();
        res.status(200).json(course);
      } catch (error) {
        console.error('Error fetching course:', error);
        res.status(404).json({ error: 'הקורס לא נמצא' });
      }
    } else {
      // טען רשימת קורסים מ-index
      const { blobs } = await list({ prefix: 'courses/index.json' });

      if (blobs.length === 0) {
        // אם אין index, החזר מערך ריק
        return res.status(200).json([]);
      }

      try {
        const response = await fetch(blobs[0].url);
        const index = await response.json();
        res.status(200).json(index);
      } catch (error) {
        console.error('Error fetching courses index:', error);
        // אם אין index, החזר מערך ריק
        res.status(200).json([]);
      }
    }
  } catch (error) {
    console.error('Courses API error:', error);
    res.status(500).json({
      error: 'שגיאת שרת פנימית',
      details: error.message
    });
  }
}
