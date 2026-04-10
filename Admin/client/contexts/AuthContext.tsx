import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<boolean>;
  verifyOTP: (otp: string) => Promise<boolean>;
  completeOnboarding: () => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  state: string;
  city: string;
  email: string;
  mobile: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials for testing
const DEMO_CREDENTIALS = {
  email: 'demo@travel.com',
  password: 'demo123',
  otp: '22222'
};

const DEMO_USER: User = {
  id: '1',
  email: 'demo@travel.com',
  firstName: 'Demo',
  lastName: 'User'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    // Check for stored authentication on app load
    const storedUser = localStorage.getItem('travel_auth_user');
    const onboardingStatus = localStorage.getItem('travel_onboarding_complete');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      setNeedsOnboarding(onboardingStatus !== 'true');
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call with demo credentials
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      setUser(DEMO_USER);
      setIsAuthenticated(true);
      setNeedsOnboarding(false); // Existing users don't need onboarding
      localStorage.setItem('travel_auth_user', JSON.stringify(DEMO_USER));
      localStorage.setItem('travel_onboarding_complete', 'true'); // Mark onboarding as complete for existing users
      return true;
    }
    return false;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    // Simulate Google OAuth
    await new Promise(resolve => setTimeout(resolve, 1500));
    setUser(DEMO_USER);
    setIsAuthenticated(true);
    setNeedsOnboarding(false); // Existing users don't need onboarding
    localStorage.setItem('travel_auth_user', JSON.stringify(DEMO_USER));
    localStorage.setItem('travel_onboarding_complete', 'true'); // Mark onboarding as complete for existing users
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setNeedsOnboarding(false);
    localStorage.removeItem('travel_auth_user');
    localStorage.removeItem('travel_onboarding_complete');
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    // Simulate registration API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    // Simulate OTP verification
    await new Promise(resolve => setTimeout(resolve, 800));

    if (otp === DEMO_CREDENTIALS.otp) {
      const newUser = {
        id: '2',
        email: 'newuser@travel.com',
        firstName: 'New',
        lastName: 'User'
      };
      setUser(newUser);
      setIsAuthenticated(true);
      setNeedsOnboarding(false); // Skip onboarding for new users
      localStorage.setItem('travel_auth_user', JSON.stringify(newUser));
      localStorage.setItem('travel_onboarding_complete', 'true'); // Mark onboarding as complete for new users
      return true;
    }
    return false;
  };

  const completeOnboarding = () => {
    setNeedsOnboarding(false);
    localStorage.setItem('travel_onboarding_complete', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        needsOnboarding,
        login,
        loginWithGoogle,
        logout,
        register,
        verifyOTP,
        completeOnboarding
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { DEMO_CREDENTIALS };
