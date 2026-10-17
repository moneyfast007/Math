# חשבון

אתר לתרגול חשבון לילדים, מגן חובה ועד כיתה ו׳. עברית, RTL, מותאם לאייפד, עובד אופליין,
בלי איסוף מידע, בלי אנליטיקס ובלי שום תקשורת מחוץ לדומיין.

## פיתוח

```sh
npm ci
npm run dev          # http://localhost:5173
npm run check        # typecheck + lint + prettier + unit tests
npm run test:e2e     # Playwright: אייפד, אייפון, מחשב (דורש: npx playwright install webkit chromium)
npm run build        # dist/
```

## מבנה

```
src/
  app/        ניתוב ומסך-על
  i18n/       כל הטקסטים (he.ts), עם וריאציות מין
  lang/       מילות מספרים בעברית ובניית spokenText
  ui/         טוקני עיצוב, <MathExpr>, מקלדת מספרים, דיאלוג, לחיצה ארוכה, קבוצות גיל
  state/      מודל הנתונים, ולידציה, אחסון ב-IndexedDB, store, גיבוי ושחזור, קוד הורים
  profiles/   דמויות (אווטארים)
  parent/     שער הורים וטופס פרופיל
  screens/    מסכים: בית, ילד, הורים, התקנה, בדיקת תצוגה
  audio/      כתובת תוכן לקליפים
  pwa/        עזרי התקנה
scripts/
  tts/        הפקת האודיו בגוגל (לא נכלל בבאנדל)
  icons/      יצירת אייקונים
tests/e2e/    Playwright
public/
  _headers    CSP ו-cache ל-Cloudflare Pages
  audio/      קובצי MP3 שנוצרו מראש (שלבים הבאים)
```

## עקרונות שאסור לשבור

- ביטוי חשבוני מוצג תמיד דרך `<MathExpr>`; בדיקת ה-e2e נכשלת אם מספרים עם סימני פעולה
  מופיעים מחוץ לו.
- טקסט שמוצג למשתמש נמצא רק ב-`src/i18n/he.ts`.
- הטקסט המוקרא (`spokenText`) הוא שדה נפרד ולעולם לא מכיל ספרות.
- אין בקשת רשת לשום דומיין אחר. ה-CSP ב-`public/_headers` אוכף זאת.

## פריסה

Cloudflare Pages מחובר לריפו: כל push ל-`main` הוא פרודקשן, כל PR מקבל כתובת preview.
הגדרות הבנייה: פקודה `npm run build`, תיקיית פלט `dist`, גרסת Node 22.
