export type Gender = "male" | "female";
const key = (id?: number) => `skyshift.addressing.${id === undefined ? "guest" : id}`;
export const readGender = (id?: number): Gender => {
  try { return localStorage.getItem(key(id)) === "male" ? "male" : "female"; }
  catch { return "female"; }
};
export const saveGender = (gender: Gender, id?: number) => {
  try { localStorage.setItem(key(id), gender); } catch { /* Session preference remains usable. */ }
};
// Explicit second-person forms only: vehicle statuses and other nouns stay intact.
const masculine: Record<string, string> = {
  "אלייך":"אליך", "ברוכה":"ברוך", "הבאה":"הבא", "השבה":"השב", "זכאית":"זכאי",
  "בחרי":"בחר", "שתבחרי":"שתבחר", "צרי":"צור", "גלי":"גלה", "היכנסי":"היכנס",
  "הקלידי":"הקלד", "תעדי":"תעד", "ועקבי":"ועקוב", "עקבי":"עקוב", "עדכני":"עדכן",
  "הזיני":"הזן", "צפי":"צפה", "נסי":"נסה", "ונסי":"ונסה", "תוכלי":"תוכל",
  "רענני":"רענן", "ובחרי":"ובחר", "בדקי":"בדוק", "המתיני":"המתן", "לחצי":"לחץ",
  "שלחי":"שלח", "הפעילי":"הפעל", "העתיקי":"העתק", "יכולה":"יכול", "מחוברת":"מחובר"
};
export const addressHebrew = (text: string, gender: Gender) => gender === "female" ? text :
  text.replace(/(^|[^א-ת])את (?=בדרך|זכאית)/g, "$1אתה ").replace(/[א-ת]+/g, word => masculine[word] ?? word);
