# הקראה קולית: הפקת האודיו

כל האודיו נוצר מראש ונשמר כקובצי MP3 סטטיים ב-`public/audio/`. הדפדפן לעולם לא פונה
לגוגל; הוא מבקש `/audio/<hash>.mp3` מהדומיין שלנו, ו-`<hash>` הוא 16 התווים הראשונים של
SHA-256 של הטקסט המוקרא. אותה פונקציה (`src/audio/hash.ts`) משמשת גם את הסקריפט וגם
את האפליקציה, ולכן לא צריך טבלת מיפוי.

## הגדרה חד-פעמית במחשב שלך

1. התקן את `gcloud` ובחר את הפרויקט שבו Cloud Text-to-Speech מופעל (אותו פרויקט של Tales):

   ```sh
   gcloud auth application-default login
   gcloud config set project <PROJECT_ID>
   export GOOGLE_CLOUD_PROJECT=<PROJECT_ID>
   ```

2. ודא שה-API מופעל: `gcloud services enable texttospeech.googleapis.com`.

אין קובץ מפתח ואין שום דבר בריפו. `.gitignore` חוסם `service-account*.json` ו-`.env` ליתר ביטחון.

## השוואת קולות (שלב 1)

```sh
npm run tts:sample            # שלוש גרסאות: gemini-flash, gemini-flash-nikud, chirp3-hd
npm run tts:sample -- --voice Kore
```

התוצאה ב-`scripts/tts/out-sample/index.html` (פותחים בדפדפן מהתיקייה). העלות המשוערת
מודפסת לפני ההפקה; המדגם כולו עולה סנטים בודדים. התיקייה לא נכנסת לגיט.

## הפקת בנק האודיו

```sh
npm run tts:build -- --dry-run          # מה חסר, וכמה זה יעלה
npm run tts:build                       # Gemini 2.5 Flash, קול Leda (ברירת מחדל)
npm run tts:build -- --engine chirp3-hd --voice Leda
```

הסקריפט מפיק רק קבצים חסרים. שינוי של משפט בקובץ התרגומים משנה את ה-hash שלו ולכן
מפיק אותו מחדש, ורק אותו. החלפת קול דורשת מחיקה של `public/audio/` כולה, והסקריפט
מסרב לערבב (הקול רשום ב-`manifest.json`).

## מה נכנס לבנק

- כל הביטויים ב-`src/i18n/he.ts`, בשני המינים כשיש הבדל.
- מספרים 0–999 בשני המינים, האלפים העגולים, "אלף" ו"מיליון". מספרים גדולים מורכבים
  בזמן ריצה מהקליפים האלה (שלב 3).
- בשלבים הבאים: רמזים, עידוד, שברים ועשרוניים, ותבניות הבעיות המילוליות.
