import { useI18n } from "./i18n";
const he = [
  "SkyShift — כשהדרך מקבלת ממד חדש",
  "עוד פקק. עוד פגישה שמתרחקת. עוד זמן שהיה יכול להיות שלך.",
  "ומה אם הדרך קדימה הייתה גם למעלה?",
  "SkyShift נולדה מהחזון לשלב בין המוכרות של מכונית לבין האפשרויות של תנועה בשמיים — ולבחון עתיד שבו עומס בכביש אינו קובע לבדו את הדרך שלנו.",
  "במסגרת הניסוי המתוכנן, המשתתפים בוחרים רכב פנוי לחודש, מתעדים טיסות ועוקבים אחר ההתקדמות באזור האישי.",
  "כדי לעודד התנסות, הגעה ל־80% מיעד הנסיעות החודשי תאפשר השתתפות בהגרלה על קבלת הרכב הניסיוני ללא עלות, בהתאם לתנאי הניסוי.",
  "היעד מחושב לפי ממוצע הנסיעות היומי שנמסר בהרשמה, כפול 30. כל טיסה שנקלטת בהתאם לכללי המערכת מקרבת אליו.",
  "הכול מרוכז במקום אחד: הרכב שלך, תיעוד הטיסות, ההתקדמות והזכאות להגרלה.",
  "מכונית בכביש. אפשרויות בשמיים. SkyShift — לדמיין את הדרך הבאה.",
  "המערכת מוצגת כעת כסביבת הדגמה לפרויקט. הרכבים, הטיסות וההגרלה ממחישים ניסוי עתידי; אין כרגע שירות טיסות או הגרלה פעילה."
];
const en = [
  "SkyShift — a new dimension to your journey",
  "Another traffic jam. Another meeting slipping away. More time that could have been yours.",
  "What if the way forward was also upward?",
  "SkyShift imagines combining the familiarity of a car with the possibilities of travel in the sky — exploring a future where road congestion does not define our journey.",
  "In the planned trial, participants choose an available vehicle for one month, record flights and follow their progress in a personal workspace.",
  "To encourage participation, reaching 80% of the monthly trip target would qualify participants for a lottery to receive the experimental vehicle at no cost, subject to the trial conditions.",
  "The target is the average daily trip count entered during registration, multiplied by 30. Each flight accepted under the system's rules brings participants closer.",
  "Everything in one place: your vehicle, flight records, progress and lottery eligibility.",
  "A car on the road. Possibilities in the sky. SkyShift — imagine your next journey.",
  "This is a project demonstration environment. Vehicles, flights and the lottery illustrate a future trial; no flight service or active lottery is currently offered."
];
export const SkyShiftStory = () => {
  const { language } = useI18n();
  const copy = language === "he" ? he : en;
  return <article className="skyshift-story"><h3>{copy[0]}</h3>{copy.slice(1,-1).map((p,i) => <p key={i}>{p}</p>)}<p className="story-note">{copy.at(-1)}</p></article>;
};
