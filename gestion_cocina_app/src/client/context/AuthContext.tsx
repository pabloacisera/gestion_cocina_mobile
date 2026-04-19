import { createContext, useEffect, useState, useContext } from "react";
import { AuthService } from "../services/AuthService";
import toast from "react-hot-toast"; // Import toast for feedback
import { User } from "../../server/schemas/userSchema"; // Assuming User schema type exists

// Define the shape of the authentication context
interface AuthContextType {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  login: (userData: Pick<User, 'email' | 'password'>) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'role' | 'createdAt' | 'updatedAt' | 'password'> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth state by checking current user session
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const currentUser = await AuthService.me(); // Use the me() function from AuthService
        setUser(currentUser);
      } catch (error) {
        // If me() throws an error (e.g., invalid token), ensure user is null
        setUser(null);
        // Don't toast here, AuthService.me() might handle specific errors or be silent on 401
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (loginData: Pick<User, 'email' | 'password'>) => {
    try {
      const loggedInUser = await AuthService.login(loginData);
      if (loggedInUser) {
        setUser(loggedInUser);
      }
      // If login fails, AuthService.login throws an error or returns null/logs out
    } catch (error) {
      // Error already handled by AuthService with toast
      setUser(null); // Ensure user is null on login failure
      throw error; // Re-throw if caller needs to handle redirection etc.
    }
  };

  const register = async (userData: Omit<User, 'id' | 'role' | 'createdAt' | 'updatedAt' | 'password'> & { password: string }) => {
    try {
      const registeredUser = await AuthService.register(userData);
      if (registeredUser) {
        setUser(registeredUser); // Optionally auto-login user after registration
        // If auto-login is not desired, just show success message
      }
      // If registration fails, AuthService.register throws an error
    } catch (error) {
      // Error already handled by AuthService with toast
      setUser(null); // Ensure user is null on registration failure
      throw error;
    }
  };

  const logout = async () => {
    try {
      const success = await AuthService.logout();
      if (success) {
        setUser(null);
      }
      // If logout fails, AuthService.logout throws an error or returns false
    } catch (error) {
      // Error already handled by AuthService with toast
      setUser(null); // Ensure user is null on logout failure
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
