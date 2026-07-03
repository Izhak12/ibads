## המטרה
נעבור מיצירת תמונות עם DALL-E (שמייצר טקסט עברי שבור) למחולל HTML/CSS אמיתי: תמונות אמיתיות של העסק כרקע + טקסט עברי שנוצר ב-AI מעל, עם ייצוא PNG להורדה.

## 1. אחסון תמונות של לקוח

**מסד נתונים:**
- Storage bucket ציבורי חדש: `client-assets`
- טבלה חדשה `client_assets` (client_id, user_id, storage_path, public_url) עם RLS לפי `auth.uid()`
- מדיניות Storage: כל משתמש מחובר יכול להעלות/למחוק תחת התיקייה שלו `{user_id}/...`, הקריאה ציבורית

## 2. מודל העלאה במודאל הלקוח

בתוך `ClientDialog` נוסיף Section חדש **"נכסים דיגיטליים (תמונות העסק)"**:
- כפתור העלאה שמקבל תמונות מרובות (drag & drop + בחירה)
- ולידציה: JPG/PNG/WebP, עד 10MB לקובץ
- העלאה מיידית ל-Storage עם progress
- רשת תמונות ממוזערות (3-4 בשורה) עם כפתור מחיקה בכל אחת
- התמונות נשמרות ומקושרות ללקוח גם בשלב עריכה וגם בשלב יצירה חדשה

## 3. שינוי לוגיקת היצירה

**Backend (`/api/generate-graphics`):**
- מבטלים לחלוטין את הקריאה ל-image generation
- קוראים ל-Lovable AI Gateway (Gemini) עם prompt שמחזיר JSON מובנה: `{ headline, subheadline, cta }` בעברית, לפי הבריף/תעשייה/טון של הלקוח
- מייצרים `amount` וריאציות טקסט שונות בקריאה אחת
- מחזירים ללקוח: מערך של `{ headline, subheadline, cta, backgroundUrl }` כשה-backgroundUrl נבחר רנדומלית מגלריית הלקוח

**Frontend (`PreviewPanel` / כרטיס גרפיקה):**
- כל כרטיס הוא DOM אמיתי בפורמט מרובע 1080x1080:
  - `<img>` של התמונה האמיתית ברקע (`object-fit: cover`)
  - Gradient overlay כהה מלמטה למעלה (`rgba(0,0,0,0.85) → transparent`)
  - טקסט עברי מעל: Headline גדול, Subheadline, CTA כ-pill button
  - כיוון RTL, טיפוגרפיה יוקרתית (Heebo/Assistant weight 700+)
  - צבעי המותג של הלקוח משמשים ל-CTA ולהדגשות
- אם אין תמונות בגלריית הלקוח → מציגים הודעה מנומסת שמפנה להעלות תמונות במודאל הלקוח

## 4. ייצוא PNG

- מתקינים `html-to-image` (עדיף על `html2canvas` — טיפול טוב יותר בפונטים, RTL, ותמונות cross-origin)
- על כל כרטיס כפתור הורדה עדין בפינה
- לחיצה → מייצא את ה-DOM ל-PNG באיכות גבוהה (1080x1080, pixelRatio=2) → הורדה מיידית עם שם קובץ מבוסס שם הלקוח + תאריך
- Toast הצלחה/כישלון

## 5. פרטים טכניים

- **Supabase Storage CORS**: bucket ציבורי → תמונות טעונות ישירות ב-`<img>` ללא בעיות tainting לצורך export
- **Preload fonts**: לפני export נוודא שהפונטים העבריים טעונים (font.loaded ready) אחרת ה-PNG יצא עם fallback
- **UI compositor component** חדש: `src/components/GraphicCard.tsx` — כרטיס יחיד עם ref שמשמש גם לתצוגה וגם ל-export
- **מבנה תשובה שרת**: JSON מובנה מ-Gemini עם `response_format` / הוראות מחמירות + ולידציה עם Zod
- **הסרת קוד ישן**: `OPENAI_API_KEY` יוצא משימוש בקוד; ניתן להשאיר את ה-secret למקרה שיוחלט לחזור בעתיד

## מה יישאר להחלטה עתידית (לא כלול כרגע)
- Templates מרובים של layout (כותרת למעלה/למטה/מרכז) — כרגע layout אחד יוקרתי אחיד
- Logo של המותג בפינה — נוסיף רק אם תרצה, כרגע אין העלאת לוגו נפרדת (אפשר להשתמש באחת מתמונות הגלריה)
