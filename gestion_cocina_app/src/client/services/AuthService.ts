import toast from "react-hot-toast";
import { User } from "../../server/schemas/userSchema"; // Assuming User schema type exists

// Define structures for auth responses
interface AuthResponse {
  success: boolean;
  data?: Omit<User, 'password'>;
  message?: string;
  error?: string;
}

interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface MeResponse {
  success: boolean;
  data?: Omit<User, 'password'>;
  error?: string;
}

export const AuthService = {
  // Register a new user
  register: async (userData: Omit<User, 'id' | 'role' | 'createdAt' | 'updatedAt' | 'password'> & { password: string }): Promise<Omit<User, 'password'> | null> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        if (errorData.errors) { // Handle validation errors
          Object.values(errorData.errors).forEach((fieldErrors: any) => {
            fieldErrors.forEach((err: string) => toast.error(err));
          });
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const result: AuthResponse = await response.json();
      if (result.success && result.data) {
        toast.success(result.message || 'Registration successful!');
        return result.data as Omit<User, 'password'>;
      } else {
        // Handle cases where API returns success: false but no error thrown by fetch
        const errorMessage = result.error || 'Registration failed.';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("AuthService registration error:", error);
      throw error; // Re-throw to be caught by caller
    }
  },

  // Login a user
  login: async (loginData: Pick<User, 'email' | 'password'>): Promise<Omit<User, 'password'> | null> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        if (errorData.errors) { // Handle validation errors
          Object.values(errorData.errors).forEach((fieldErrors: any) => {
            fieldErrors.forEach((err: string) => toast.error(err));
          });
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const result: AuthResponse = await response.json();
      if (result.success && result.data) {
        toast.success(result.message || 'Login successful!');
        return result.data as Omit<User, 'password'>;
      } else {
        const errorMessage = result.error || 'Login failed.';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("AuthService login error:", error);
      throw error;
    }
  },

  // Logout a user
  logout: async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST', // Or GET depending on backend implementation
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const result: LogoutResponse = await response.json();
      if (result.success) {
        toast.success(result.message || 'Logout successful!');
        return true;
      } else {
        const errorMessage = result.error || 'Logout failed.';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("AuthService logout error:", error);
      throw error;
    }
  },

  // Get current logged-in user
  me: async (): Promise<Omit<User, 'password'> | null> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If not authenticated or token is invalid/expired, don't toast an error,
        // but allow the caller to handle it (e.g., redirect to login)
        if (response.status === 401) {
          // Optionally clear local token if applicable, though cookie is handled server-side
          return null; 
        }
        const errorData = await response.json();
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        // Don't toast general auth errors here, let AuthContext decide action
        // toast.error(errorMessage); 
        throw new Error(errorMessage);
      }

      const result: MeResponse = await response.json();
      if (result.success && result.data) {
        return result.data;
      } else {
        // If API returns success: false, but status was OK (e.g., 200 but data missing)
        // Or if API explicitly sends an error message in success: false
        if (result.error) {
             // This case might be rare if 401 is handled above, but good for robustness
             // toast.error(result.error);
        }
        return null;
      }
    } catch (error: any) {
      console.error("AuthService me error:", error);
      // If the error is related to auth (e.g., network error after token expiry),
      // the AuthContext should handle clearing session if necessary.
      // Avoid throwing generic errors here that might cause infinite loops if not handled.
      if (error.message && !error.message.includes('HTTP error')) { // Avoid re-throwing already handled HTTP errors
        // Rethrow unexpected errors
        throw error;
      }
      return null; // Assume null if fetching fails and it's not a critical error (e.g. network down)
    }
  },
};
