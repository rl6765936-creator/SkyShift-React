import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { Languages } from "lucide-react";
import hebrew from "./he.json";
import { useAuth } from "./auth";
import { addressHebrew, readGender, saveGender, type Gender } from "./addressing";
type Language = "en" | "he";
const dictionary: Record<string, string> = hebrew;
const patterns = Object.entries(dictionary)
  .filter(([key]) => /\{\d+\}/.test(key))
  .map(([key, value]) => ({
    regex: new RegExp(
      "^" +
        key
          .split(/\{\d+\}/)
          .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("(.*?)") +
        "$",
    ),
    value,
  }));
const Context = createContext<{
  language: Language;
  gender: Gender;
  setGender: (value: Gender) => void;
  address: (text: string) => string;
  setLanguage: (value: Language) => void;
  t: (text: string) => string;
} | null>(null);
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [guestGender, setGuestGender] = useState<Gender>(() => readGender());
  const gender = session?.gender === "Male" ? "male" : session?.gender === "Female" ? "female" : session ? readGender(session.id) : guestGender;
  const setGender = (value: Gender) => { setGuestGender(value); saveGender(value); };
  const address = useCallback((text: string) => addressHebrew(text, gender), [gender]);
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem("skyshift.language") === "he" ? "he" : "en";
    } catch {
      return "en";
    }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
    try {
      localStorage.setItem("skyshift.language", language);
    } catch {
      /* The current session still works with storage disabled. */
    }
  }, [language]);
  const t = useCallback(
    (text: string) => {
      if (language === "en") return text;
      if (dictionary[text]) return address(dictionary[text]);
      for (const pattern of patterns) {
        const match = text.match(pattern.regex);
        if (match)
          return address(pattern.value).replace(
            /\{(\d+)\}/g,
            (_, index: string) => match[Number(index) + 1] ?? "",
          );
      }
      return text;
    },
    [language, address],
  );
  return (
    <Context.Provider value={{ language, setLanguage, gender, setGender, address, t }}>
      {children}
    </Context.Provider>
  );
};
export const useI18n = () => {
  const context = useContext(Context);
  if (!context) throw new Error("LanguageProvider is missing");
  return context;
};
export const LanguageSwitch = ({
  floating = false,
}: {
  floating?: boolean;
}) => {
  const { language, setLanguage } = useI18n();
  return (
    <div
      className={`language-switch ${floating ? "floating" : ""}`}
      role="group"
      aria-label={language === "he" ? "בחירת שפה" : "Choose language"}
    >
      <Languages size={16} aria-hidden="true" />
      <button
        type="button"
        lang="he"
        aria-pressed={language === "he"}
        onClick={() => setLanguage("he")}
      >
        עברית
      </button>
      <button
        type="button"
        lang="en"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        English
      </button>
    </div>
  );
};
