import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, storeUser, storedUser } from "./api.js";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(storedUser);
  const [config, setConfig] = useState({ runner: "browser", tutor: false });
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    api("/config").then(setConfig).catch(() => {});
  }, []);

  const signIn = useCallback(async (name, role = "student") => {
    const u = await api("/session", { method: "POST", body: { name, role } });
    storeUser(u);
    setUser(u);
    setSignInOpen(false);
    return u;
  }, []);

  const signOut = useCallback(() => {
    storeUser(null);
    setUser(null);
  }, []);

  const requireUser = useCallback(() => {
    if (!user) setSignInOpen(true);
    return Boolean(user);
  }, [user]);

  return (
    <SessionContext.Provider value={{ user, config, signIn, signOut, requireUser, signInOpen, setSignInOpen }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
