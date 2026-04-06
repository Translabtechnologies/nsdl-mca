import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Set to true temporarily if you want to bypass login during development
  // const [isAuthenticated, setIsAuthenticated] = useState(true);
  // const [user, setUser] = useState<any>(null);
  const [isAuthenticated] = useState(true);
  const [user] = useState({ name: "Admin User" });

  const login = () => {
    // Future LDAP login logic goes here
    // setIsAuthenticated(true);
    // setUser({ name: "Admin User" });
  };

  const logout = () => {
    // setIsAuthenticated(false);
    // setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
