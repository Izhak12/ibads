import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  headline: z.string(),
  subheadline: z.string().optional().default(""),
  cta: z.string(),
  designBrief: z.string().optional().default(""),
  clientName: z.string().optional().default(""),
  clientIndustry: z.string().optional().default(""),
  targetAudience: z.string().optional().default(""),
  brandVibe: z.string().optional().default(""),
  brandColors: z.array(z.string()).optional().default([]),
  assetUrls: z.array(z.string()).optional().default([]),
  referenceUrls: z.array(z.string()).optional().default([]),
  systemDesign: z
    .object({
      colors: z.array(z.string()).optional().default([]),
      headlineFont: z.string().optional().default(""),
      ctaStyle: z.string().optional().default(""),
    })
    .nullish(),
});

type Input = z.infer<typeof InputSchema>;


function buildPrompt(input: Input, hasPhotos: boolean, hasRefs: boolean) {
  const clientName = input.clientName || "לא צוין";
  const industry = input.clientIndustry || "לא צוין";
  const audience = input.targetAudience || "קהל רחב";
  const vibe = input.brandVibe || "פרימיום ומודרני";
  const colors = input.brandColors.length
    ? input.brandColors.join(", ")
    : "פלטת ניטרלים אלגנטית";
  const brief =
    input.designBrief ||
    "מודעה מרובעת פרימיום עם היררכיה טיפוגרפית ברורה, שטחים לבנים נדיבים ותחושת יוקרה.";

  const businessBlock = `שם העסק: ${clientName}
תחום: ${industry}
קהל יעד: ${audience}
טון וסגנון מותג: ${vibe}
צבעי מותג לשילוב: ${colors}
בריף ארט־דירקטור לגרפיקה הזו בלבד:
${brief}`;

  let imagesBlock = "";
  if (hasPhotos && hasRefs) {
    imagesBlock = `שימוש בתמונות:
אני מצרף לך תמונות אמיתיות מהעסק וגם דוגמאות סטייל של מודעות מוגמרות.
התמונות הראשונות המצורפות הן צילומים אמיתיים של העסק — אתה יכול לבחור להשתמש בתמונה אחת, בכמה תמונות, או בכולן, לפי מה שהכי נכון לעיצוב ולמסר. אל תעוות פנים, מזון או מוצרים.
התמונות האחרונות המצורפות הן דוגמאות סטייל בלבד — העתק מהן את שפת העיצוב, צפיפות הלייאאוט, סגנון הטיפוגרפיה, הבאדג'ים, האלמנטים הדקורטיביים והגימור הכללי, אך אל תעתיק את הטקסטים שלהן ולא את הצילומים שלהן.
המטרה היא שהגרפיקה תרגיש אמיתית, יוקרתית, מושכת ולא כמו עיצוב AI גנרי.`;
  } else if (hasPhotos) {
    imagesBlock = `שימוש בתמונות:
אני מצרף לך תמונות אמיתיות מהעסק.
אתה יכול לבחור להשתמש בתמונה אחת, בכמה תמונות, או בכולן — לפי מה שהכי נכון לעיצוב ולמסר.
המטרה היא שהגרפיקה תרגיש אמיתית, יוקרתית, מושכת ולא כמו עיצוב AI גנרי.`;
  } else if (hasRefs) {
    imagesBlock = `שימוש בתמונות:
התמונות המצורפות הן דוגמאות סטייל של מודעות מוגמרות בלבד — העתק מהן את שפת העיצוב, צפיפות הלייאאוט, סגנון הטיפוגרפיה, הבאדג'ים, האלמנטים הדקורטיביים והגימור הכללי, אך אל תעתיק את הטקסטים שלהן ולא את הצילומים שלהן.
הרכב לייאאוט מקורי שמתאים לעסק, בלי להמציא לוגו או שם עסק.`;
  } else {
    imagesBlock = `שימוש בתמונות:
אין צילומים מצורפים — הרכב לייאאוט אדיטוריאלי פרימיום שמתאים לעסק, בלי להמציא לוגואים או צילומים של אנשים אמיתיים.`;
  }

  const sd = input.systemDesign ?? null;
  const sdColors = (sd?.colors ?? []).filter(Boolean);
  const systemDesignBlock = `מערכת עיצוב קבועה (system_design) — חובה להשתמש באותה מערכת בכל גרפיקה עבור אותו לקוח, גם אם זו הרצה נפרדת:
- פלטת צבעים: ${
    sdColors.length
      ? sdColors.join(", ")
      : input.brandColors.length
        ? input.brandColors.join(", ")
        : "בחר 2-3 צבעים מדויקים בקוד הקס ושמור עליהם לאורך כל הגרפיקה"
  }
- פונט לכותרת: ${sd?.headlineFont || "סאנס-בולד-מודרני"}
- סגנון כפתור CTA: ${sd?.ctaStyle || "כפתור בפינות מעוגלות, מילוי מלא בצבע האקסנט, קונטרסט גבוה מובטח מול הרקע"}
- לא לסטות מהמערכת הזו בין גרפיקות שונות של אותו עסק, גם אם הבריף משתמע לכמה כיוונים.

אכיפת מערכת עיצוב (design_system):
${
    sd
      ? `קיים design_system שמור עבור הלקוח הזה מהרצה קודמת — חובה להשתמש בו במדויק (אותה פלטת צבעים, אותו פונט, אותו סגנון וניסוח CTA), ואסור לסטות ממנו או "לפרש מחדש" אותו.`
      : `אין design_system שמור — זו ההרצה הראשונה עבור הלקוח. צור מערכת עיצוב מפורשת וברורה (פלטה מדויקת, פונט אחד לכותרת, סגנון CTA אחד), כי היא תשמש כבסיס לכל הגרפיקות הבאות שלו.`
  }`;

  return `תפקיד ופרסונה:
אתה גרפיקאי בכיר ומומחה לקריאייטיבים לממומן, עם ניסיון של 10 שנים בעיצוב מודעות שמביאות תוצאות. אתה מתמחה ביצירת גרפיקות מרובעות למודעות בפייסבוק/אינסטגרם, תוך שמירה על עיצוב מקצועי, היררכיית טקסט נכונה, UI נקי, קופי שיווקי חד, ושימוש נכון בתמונות של העסק.

המשימה:
צור עבורי גרפיקה שיווקית אחת בלבד, ברזולוציה מרובעת 1:1, עבור העסק שלי.

העסק שלי הוא:
${businessBlock}

${imagesBlock}

${systemDesignBlock}

מבנה הטקסט על הגרפיקה — חובה להופיע בגרפיקה בדיוק אות־באות, בעברית תקינה מימין לשמאל, בלי שגיאות ובלי המצאת מילים:

1. כותרת חזקה וברורה (הגדולה ביותר, מודגשת): '${input.headline}'
   - תפקיד: משיכת תשומת לב ורגש/יתרון.

2. תת־כותרת (קטנה יותר, תומכת): '${input.subheadline}'
   - תפקיד חובה: לומר במפורש מהו סוג השירות/מוצר ולמי הוא מיועד — לא רק רגש. גולש שרואה רק את השורה הזו לבד (בלי הכותרת) חייב להבין תוך שנייה באיזה תחום עסק מדובר (למשל: קייטרינג לאירועים, שפית פרטית, מסעדה, וכו').
   - אסור שהתת-כותרת תהיה כללית מספיק כדי להתאים לכל עסק אחר בתחום מקביל.

3. הנעה לפעולה ברורה (מעוצבת בבירור ככפתור, בניגוד צבעים גבוה לרקע): '${input.cta}'

אין להוסיף שום טקסט אחר מעבר לשלושת אלה.

הנחיות ל-CTA (הנעה לפעולה):
- ה-CTA חייב להתאים לשלב מוקדם במשפך השיווקי (זו מודעה ראשונה שהגולש רואה, לא שלב סגירת עסקה) — לכן רמת המחויבות המבוקשת מהגולש צריכה להיות נמוכה: קבלת מידע, הצעת מחיר, או שיחת ייעוץ — לא "קביעת פגישה" או משהו שדורש התחייבות של זמן.
- מומלץ להשתמש בניסוח שאינו פונה בציווי-יחיד ("גלה", "צור") אלא בלשון רבים-סתמית ("קבלו", "גלו", "דברו איתנו") או בצורת שם-פעולה ("לקבלת הצעת מחיר", "לשיחת ייעוץ") — זה גם נשמע פחות תובעני וגם עקבי יותר.
- אסור להשתמש במילים בירוקרטיות או קרות ("לבירורים", "לפרטים נוספים בלבד") — ה-CTA צריך להרגיש כמו הזמנה, לא כמו פנייה למוקד שירות.
- אסור ליצור דחיפות מלאכותית שלא מתאימה למיצוב פרימיום ("היום בלבד", "מבצע לזמן מוגבל") אלא אם הבריף של הלקוח מבקש זאת במפורש.
- אם קיים design_system שמור עבור הלקוח — סגנון ה-CTA (ניסוח, טון) חייב להישאר עקבי בין כל הגרפיקות של אותו לקוח, בדיוק כמו הפלטה והפונט.

בדיקת איות עצמית (חובה לפני סיום):
לפני שאתה מסיים את הגרפיקה, עבור מילה-מילה על כל טקסט עברי שתכננת להציג, ווודא שכל מילה היא מילה תקנית וקיימת בעברית. אם יש ספק לגבי איות של מילה — אל תשתמש בה, בחר ניסוח חלופי בטוח ופשוט יותר. אסור בהחלט להשתמש במילה שאינה קיימת בעברית תקנית (למשל "הרמוגיה" במקום "הרמוניה") — זו שגיאה חמורה יותר מכל בעיה עיצובית אחרת.

דגשים חשובים לעיצוב:
- רזולוציה מרובעת בלבד 1:1.
- היררכיית טקסט ברורה: כותרת גדולה, תת־כותרת בינונית, CTA ברור.
- לא להעמיס יותר מדי טקסט.
- הסובייקט (מוצר/אוכל/שירות) במרכז, נראה מגרה, נקי ואיכותי.
- קריאות גבוהה גם במסך טלפון — ודא שה-CTA לא נטמע ברקע (בדוק קונטרסט בפועל, לא רק תיאורטית).
- הקפד על מערכת העיצוב הקבועה שהוגדרה למעלה בכל הרצה.
- אפשר להוסיף אלמנטים גרפיים עדינים, בלי להגזים.

גבולות גזרה:
- אסור רזולוציה שונה מ־1:1.
- אסור להמציא שם עסק.
- אסור להמציא לוגו.
- אסור טקסט עם שגיאות כתיב או אותיות מעוותות.
- אסור טקסט מעוות או לא קריא.
- אסור להשתמש במילים מסובכות מדי.
- אסור עיצוב עמוס מדי.
- אסור לשכוח את ה-CTA.
- אסור שהגרפיקה תיראה כמו תבנית גנרית או AI זול.
- אסור שהמודעה תרגיש כאילו היא פונה לקהל שמחפש מחיר זול.
- אסור סטייה ממערכת העיצוב הקבועה שהוגדרה עבור העסק.
- אסור תת־כותרת שלא מבהירה במפורש מהו סוג השירות.

המטרה הסופית:
מודעה שנראית יוקרתית, אמינה ומושכת, עם זהות ויזואלית עקבית לאורך כל הגרפיקות של אותו עסק — שגורמת לאנשים בקהל היעד להשאיר פרטים או לשלוח הודעה.

professional advertising design, consistent brand identity across all creatives for this business, clean visual hierarchy, premium finish, no invented logos or business names, no extra text beyond what was specified.`;
}


async function fetchAsBlob(url: string): Promise<{ blob: Blob; filename: string } | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "image/png";
    const buf = await r.arrayBuffer();
    const ext = ct.includes("jpeg") || ct.includes("jpg") ? "jpg" : ct.includes("webp") ? "webp" : "png";
    return { blob: new Blob([buf], { type: ct }), filename: `image.${ext}` };
  } catch {
    return null;
  }
}

async function callGenerations(apiKey: string, prompt: string) {
  return fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt,
      size: "1024x1024",
      quality: "high",
      n: 1,
    }),
  });
}

export const Route = createFileRoute("/api/generate-ad-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
        }
        let input: Input;
        try {
          input = InputSchema.parse(await request.json());
        } catch (err) {
          return Response.json({ error: "Invalid input", details: String(err) }, { status: 400 });
        }

        const assetUrls = input.assetUrls.slice(0, 3);
        const referenceUrls = input.referenceUrls.slice(0, 3);
        const hasAny = assetUrls.length > 0 || referenceUrls.length > 0;

        try {
          let res: Response;
          if (hasAny) {
            // Order matters: photos first, references last (prompt refers to them as "first" / "last").
            const photos = (await Promise.all(assetUrls.map(fetchAsBlob))).filter(
              (p): p is { blob: Blob; filename: string } => p !== null,
            );
            const refs = (await Promise.all(referenceUrls.map(fetchAsBlob))).filter(
              (p): p is { blob: Blob; filename: string } => p !== null,
            );
            const prompt = buildPrompt(input, photos.length > 0, refs.length > 0);

            if (photos.length === 0 && refs.length === 0) {
              res = await callGenerations(apiKey, prompt);
            } else {
              const fd = new FormData();
              fd.append("model", "gpt-image-2");
              fd.append("prompt", prompt);
              fd.append("size", "1024x1024");
              fd.append("quality", "high");
              fd.append("n", "1");
              for (const p of photos) {
                fd.append("image[]", p.blob, `photo-${p.filename}`);
              }
              for (const r of refs) {
                fd.append("image[]", r.blob, `reference-${r.filename}`);
              }
              res = await fetch("https://api.openai.com/v1/images/edits", {
                method: "POST",
                headers: { Authorization: `Bearer ${apiKey}` },
                body: fd,
              });
              // Fallback if edits fails (e.g. org verification required for edits).
              if (!res.ok) {
                console.warn(
                  `[generate-ad-image] images/edits failed (${res.status}); falling back to generations`,
                );
                res = await callGenerations(apiKey, prompt);
              }
            }
          } else {
            const prompt = buildPrompt(input, false, false);
            res = await callGenerations(apiKey, prompt);
          }

          if (!res.ok) {
            const text = await res.text();
            const status = res.status === 402 || res.status === 429 ? res.status : 500;
            return Response.json({ error: `OpenAI ${res.status}: ${text}` }, { status });
          }
          const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
          const b64 = json.data?.[0]?.b64_json;
          if (!b64) {
            return Response.json({ error: "No image returned" }, { status: 500 });
          }
          return Response.json({ b64 });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
