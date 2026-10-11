import { ApiError } from "./api";

// Match the existing backend's ProblemDetails without changing its API.
export const errorMessages = (error: unknown, language: "he" | "en"): string[] => {
  const pick = (en: string, he: string) => language === "he" ? he : en;
  const generic = () => pick("Something went wrong. Please try again.", "אירעה שגיאה. נסי שוב.");
  if (!(error instanceof ApiError)) return [generic()];
  const localized = language === "he" ? error.messageHe : error.messageEn;
  if (localized && error.status < 500) return [localized];
  const flightMessages: Record<string, [string, string]> = {
    duplicate_flight: ["This flight date and time have already been recorded. Your progress was not counted twice.", "כבר תועדה טיסה בתאריך ובשעה האלה. ההתקדמות לא נספרה שוב."],
    flight_in_future: ["A completed flight cannot have a future date or time.", "לא ניתן לתעד טיסה בתאריך או בשעה עתידיים."],
    flight_outside_trial: ["The flight must be within your assigned vehicle’s trial period, including its start and end times.", "מועד הטיסה חייב להיות בתוך חודש הניסיון של הקצאת הרכב, כולל שעות ההתחלה והסיום."],
  };
  if (error.code && flightMessages[error.code]) return [pick(...flightMessages[error.code])];
  const detail = error.message;
  if (/^Email '.+' is already registered\.$/i.test(detail))
    return [pick("This email address is already registered. Sign in or use a different email address.", "כתובת האימייל הזו כבר רשומה במערכת. התחברי לחשבון הקיים או השתמשי בכתובת אחרת.")];
  if (/invalid email or password|email or password is incorrect/i.test(detail))
    return [pick("The email address or password is incorrect. Check both and try again.", "כתובת האימייל או הסיסמה שגויות. בדקי את שני הפרטים ונסי שוב.")];
  if (error.status === 0)
    return [pick("Unable to connect to SkyShift. Check your connection and that the backend is running, then try again.", "לא ניתן להתחבר ל־SkyShift. בדקי את החיבור ושהבקנד פועל, ונסי שוב.")];
  if (error.status === 401)
    return [error.path.startsWith("/auth/")
      ? pick("The email address or password is incorrect. Check both and try again.", "כתובת האימייל או הסיסמה שגויות. בדקי את שני הפרטים ונסי שוב.")
      : pick("Your session has expired. Please sign in again.", "ההתחברות פגה או אינה תקפה. התחברי שוב כדי להמשיך.")];
  if (error.status === 403)
    return [pick("You do not have permission to perform this action.", "אין לך הרשאה לבצע את הפעולה הזו.")];
  if (/User already has an active vehicle assignment/i.test(detail))
    return [pick("You already have an assigned vehicle. Open My vehicle to view it.", "כבר מוקצה לך רכב. תוכלי לצפות בו במסך הרכב שלי.")];
  if (/User has no active vehicle assignment/i.test(detail))
    return [pick("Select an available vehicle before recording a flight.", "כדי לתעד טיסה, בחרי קודם רכב פנוי.")];
  if (/Vehicle \d+ is not available for assignment|selected by another participant/i.test(detail))
    return [pick("This vehicle is no longer available. Refresh the list and choose another vehicle.", "הרכב הזה אינו פנוי כעת. רענני את הרשימה ובחרי רכב אחר.")];
  if (/cannot transition from/i.test(detail))
    return [pick("This status change is not allowed from the vehicle's current status. Refresh and choose an allowed status.", "לא ניתן לבצע את שינוי המצב הזה מהמצב הנוכחי של הרכב. רענני ובחרי מצב מותר.")];
  if (error.status === 400 && Object.keys(error.fieldErrors).length) {
    const messages: string[] = [];
    for (const [key, values] of Object.entries(error.fieldErrors)) {
      const field = key.replace(/^\$\./, "").split(".").pop()?.toLowerCase();
      for (const value of values) {
        let message: string;
        if (field === "name") message = pick("Full name is required and must contain between 1 and 200 characters.", "יש להזין שם מלא באורך של 1 עד 200 תווים.");
        else if (field === "email") message = pick("Enter a valid email address.", "יש להזין כתובת אימייל תקינה.");
        else if (field === "password") message = pick("Enter a password containing at least 6 characters.", "יש להזין סיסמה באורך של 6 תווים לפחות.");
        else if (field === "averagedailytrips") message = pick("Average daily trips must be a whole number of at least 1.", "ממוצע הנסיעות היומי חייב להיות מספר שלם של 1 לפחות.");
        else if (field === "date") message = pick("Enter a valid flight date and time.", "יש להזין תאריך ושעת טיסה תקינים.");
        else if (field === "targetstatus") message = pick("Choose a valid vehicle status.", "יש לבחור מצב רכב תקין.");
        else message = language === "en" ? value : "חלק מהפרטים שהוזנו אינם תקינים. בדקי את השדות ונסי שוב.";
        if (!messages.includes(message)) messages.push(message);
      }
    }
    return messages.length ? messages : [generic()];
  }
  if (error.status === 400) return [pick("Some details are invalid. Check the form and try again.", "חלק מהפרטים אינם תקינים. בדקי את הטופס ונסי שוב.")];
  if (error.status === 404) return [pick("The requested item was not found. Refresh and try again.", "הפריט המבוקש לא נמצא. רענני ונסי שוב.")];
  if (error.status === 409) return [pick("The action conflicts with the current state. Refresh the data and try again.", "לא ניתן להשלים את הפעולה בגלל המצב הנוכחי של הנתונים. רענני ונסי שוב.")];
  if (error.status === 429) return [pick("Too many requests. Please wait a moment and try again.", "נשלחו יותר מדי בקשות. המתיני מעט ונסי שוב.")];
  if (error.status >= 500) return [pick("The server could not complete the action. Please try again later.", "אירעה תקלה בשרת והפעולה לא הושלמה. נסי שוב מאוחר יותר.")];
  return [language === "en" ? detail : generic()];
};
