import { head } from '@vercel/blob';

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
      try {
        const { url } = await head(`courses/${courseId}.json`);
        const response = await fetch(url);
        const course = await response.json();
        return res.status(200).json(course);
      } catch (error) {
        console.error('Error fetching course:', error);
        return res.status(404).json({ error: 'הקורס לא נמצא' });
      }
    } else {
      // טען רשימת קורסים מ-index
      try {
        const { url } = await head('courses-index.json');
        const response = await fetch(url);
        const courses = await response.json();
        return res.status(200).json(courses);
      } catch (error) {
        console.error('Error fetching courses index:', error);
        // אם אין index - החזר רשימה ריקה
        return res.status(200).json([]);
      }
    }
  } catch (error) {
    console.error('Courses API error:', error);
    // החזר רשימה ריקה במקום שגיאה
    return res.status(200).json([]);
  }
}
