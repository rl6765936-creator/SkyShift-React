import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setBearer } from "./api";
import type { AuthResponse, Session } from "./types";
const storageKey = "skyshift.session";
// JWT decoding only selects UI/navigation. The backend validates the token and enforces roles.
export const toSession = (response: AuthResponse): Session => {
  const encoded = response.token.split(".")[1];
  if (!encoded) throw new Error("The server returned an invalid session.");
  const decoded: unknown = JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(
        atob(
          encoded
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(encoded.length / 4) * 4, "="),
        ),
        (char) => char.charCodeAt(0),
      ),
    ),
  );
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("exp" in decoded) ||
    typeof decoded.exp !== "number"
  )
    throw new Error("The server returned an invalid session.");
  const claim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
  const role =
    claim in decoded
      ? decoded[claim]
      : "role" in decoded
        ? decoded.role
        : undefined;
  if (role !== "User" && role !== "Manager")
    throw new Error("The server returned an unsupported role.");
  return { ...response, role, expiresAt: decoded.exp * 1000 };
};
const restore = (): Session | null => {
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem(storageKey) || "null",
    );
    if (
      !value ||
      typeof value !== "object" ||
      !("token" in value) ||
      typeof value.token !== "string" ||
      !("id" in value) ||
      typeof value.id !== "number" ||
      !("name" in value) ||
      typeof value.name !== "string" ||
      !("email" in value) ||
      typeof value.email !== "string"
    )
      return null;
    const session = toSession({
      token: value.token,
      id: value.id,
      name: value.name,
      email: value.email,
      gender: "gender" in value && (value.gender === "Male" || value.gender === "Female") ? value.gender : null,
    });
    session.isNewAccount = "isNewAccount" in value && value.isNewAccount === true;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
};
interface AuthContextValue {
  session: Session | null;
  expired: boolean;
  signIn: (response: AuthResponse, isNewAccount?: boolean) => Session;
  signOut: () => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState(restore);
  const [expired, setExpired] = useState(false);
  const client = useQueryClient();
  // Set synchronously so child queries never start without the restored bearer.
  setBearer(session?.token || null);
  const clear = () => {
    setBearer(null);
    setSession(null);
    sessionStorage.removeItem(storageKey);
    client.clear();
  };
  useEffect(() => {
    const unauthorized = () => {
      clear();
      setExpired(true);
    };
    window.addEventListener("skyshift:unauthorized", unauthorized);
    const timeout = session
      ? window.setTimeout(
          unauthorized,
          Math.max(0, session.expiresAt - Date.now()),
        )
      : undefined;
    return () => {
      window.removeEventListener("skyshift:unauthorized", unauthorized);
      window.clearTimeout(timeout);
    };
  }, [session, client]);
  const signIn = (response: AuthResponse, isNewAccount = false) => {
    const next = { ...toSession(response), isNewAccount };
    if (next.expiresAt <= Date.now())
      throw new Error("This session has already expired.");
    client.clear();
    setBearer(next.token);
    setSession(next);
    setExpired(false);
    sessionStorage.setItem(storageKey, JSON.stringify(next));
    return next;
  };
  return (
    <AuthContext.Provider
      value={{
        session,
        expired,
        signIn,
        signOut: () => {
          clear();
          setExpired(false);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is missing.");
  return context;
};
