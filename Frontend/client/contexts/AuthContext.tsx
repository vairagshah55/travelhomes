import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'user' | 'vendor';
  vendorStatus?: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'banned' | 'kyc-unverified';
  photo?: string;
  phoneNumber?: string;
  state?: string;
  city?: string;
  idProof?: string;
  dateOfBirth?: string;
  mobileVerified?: boolean;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string, rememberMe?: boolean, userType?: 'user' | 'vendor') => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  handleGoogleCallback: (code: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ ok: boolean; registerId?: string; code?: number; message?: string }>;
  verifyOTP: (otp: string) => Promise<boolean>;
  completeOnboarding: () => void;
  updateUserType: (userType: 'user' | 'vendor') => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  lastRegisterId?: string | null;
  authenticateAfterRegister: (u: { id?: string; email: string; firstName?: string; lastName?: string; userType?: 'user' | 'vendor' }) => void;
}

interface RegisterData {
  userType: 'user' | 'vendor';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  state: string;
  city: string;
  email: string;
  mobile: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials for testing
// const DEMO_CREDENTIALS = {
//   email: 'demo@travel.com',
//   password: 'demo123',
//   otp: '22222'
// };

// const DEMO_USER: User = {
//   id: '1',
//   email: 'demo@travel.com',
//   firstName: 'Demo',
//   lastName: 'User',
//   userType: 'user'
// };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('travel_auth_user') || sessionStorage.getItem('travel_auth_user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed && !parsed.id && parsed._id) {
        parsed.id = parsed._id;
      }
      return parsed;
    } catch { return null; }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const local = !!localStorage.getItem('travel_auth_user') && !!localStorage.getItem('travel_auth_token');
    const session = !!sessionStorage.getItem('travel_auth_user') && !!sessionStorage.getItem('travel_auth_token');
    return local || session;
  });

  const [needsOnboarding, setNeedsOnboarding] = useState(() => {
     const localUser = localStorage.getItem('travel_auth_user');
     const sessionUser = sessionStorage.getItem('travel_auth_user');
     
     if (!localUser && !sessionUser) return false;
     
     if (localUser) {
       return localStorage.getItem('travel_onboarding_complete') !== 'true';
     } else {
       return sessionStorage.getItem('travel_onboarding_complete') !== 'true';
     }
  });

  const [lastRegisterId, setLastRegisterId] = useState<string | null>(
    () => sessionStorage.getItem('reg_register_id')
  );
  const lastUserTypeUpdateAt = React.useRef<number>(0);

  // Clean up invalid/fake tokens on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
    if (storedToken && !storedToken.includes('.')) {
      // Valid JWTs always have 3 dot-separated parts (header.payload.signature)
      // Fake tokens like "dev_token_..." or "demo_token_..." have no dots
      console.warn('Invalid token detected, clearing auth state');
      localStorage.removeItem('travel_auth_user');
      localStorage.removeItem('travel_auth_token');
      localStorage.removeItem('travel_onboarding_complete');
      sessionStorage.removeItem('travel_auth_user');
      sessionStorage.removeItem('travel_auth_token');
      sessionStorage.removeItem('travel_onboarding_complete');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Auto-refresh user profile when tab regains focus (picks up admin approval, etc.)
  const refreshUserRef = React.useRef<() => Promise<void>>();

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user?.email) {
        refreshUserRef.current?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isAuthenticated, user?.email]);

  // Refresh user profile on initial app load to pick up vendorStatus changes
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      // Small delay to let the app render first, then refresh in background
      const t = setTimeout(() => refreshUserRef.current?.(), 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true, _userType?: 'user' | 'vendor'): Promise<boolean> => {
    // if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
    //   const loggedInUser = { ...DEMO_USER, userType: userType || 'user' as 'user' | 'vendor' };
    //   setUser(loggedInUser);
    //   setIsAuthenticated(true);
    //   setNeedsOnboarding(false);
    //   const storage = rememberMe ? localStorage : sessionStorage;
    //   storage.setItem('travel_auth_user', JSON.stringify(loggedInUser));
    //   storage.setItem('travel_onboarding_complete', 'true');
    //   storage.setItem('travel_auth_token', 'demo_token_' + Date.now());
    //   try { storage.setItem('last_login_userType', JSON.stringify(loggedInUser.userType)); } catch {}
    //   return true;
    // }

    const { vendorAuthApi } = await import('../lib/api');

    const tryOnce = async (t: 'user'|'vendor') => {
      try {
        const resp = await vendorAuthApi.login({ email, password, userType: t, remember: rememberMe });
        return { ok: !!resp?.success, resp } as const;
      } catch (e: any) {
        const msg = String(e?.message || '');
        const m = msg.match(/^HTTP\s+(\d+)/);
        const code = m ? Number(m[1]) : undefined;
        return { ok: false, code } as const;
      }
    };

    const r = await tryOnce( 'user');
    if (r.ok && r.resp) {
      const u = r.resp.user;
      const loggedInUser: User = {
        id: u.id || (u as any)._id,
        email: u.email,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        userType: (u.userType as any)?.toLowerCase() as 'user' | 'vendor',
        vendorStatus: (u as any).vendorStatus,
        photo: u.photo,
        phoneNumber: u.phoneNumber || u.mobile,
        state: u.state,
        city: u.city,
        idProof: u.idProof,
        dateOfBirth: u.dateOfBirth,
      };
      setUser(loggedInUser);
      setIsAuthenticated(true);
      setNeedsOnboarding(false);

      const storage = rememberMe ? localStorage : sessionStorage;
      // Clear other storage
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem('travel_auth_user');
      otherStorage.removeItem('travel_onboarding_complete');
      otherStorage.removeItem('travel_auth_token');
      otherStorage.removeItem('last_login_userType');

      storage.setItem('travel_auth_user', JSON.stringify(loggedInUser));
      storage.setItem('travel_onboarding_complete', 'true');
      storage.setItem('travel_auth_token', r.resp.token);
      setToken(r.resp.token);
      try { storage.setItem('last_login_userType', JSON.stringify(u.userType)); } catch {}
      return true;
    }

    // TODO: Remove this dev bypass before production — allows login even when
    // server-side OTP was not verified (e.g. static OTP used during registration)
    if (r.code === 403) {
      console.log('DEV: OTP not verified on server, attempting force-verify then retry');
      const { authApi } = await import('../lib/api');
      try {
        // Force-verify OTP so the server marks the user as verified
        const regId = sessionStorage.getItem('reg_register_id');
        if (regId) await authApi.verifyRegisterOtp(regId, '000000').catch(() => {});
      } catch {}

      // Retry login — should now succeed with a real JWT
      const retry = await tryOnce('user');
      if (retry.ok && retry.resp) {
        const u = retry.resp.user;
        const loggedInUser: User = {
          id: u.id || (u as any)._id,
          email: u.email,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          userType: (u.userType as any)?.toLowerCase() as 'user' | 'vendor',
        };
        setUser(loggedInUser);
        setIsAuthenticated(true);
        setNeedsOnboarding(false);
        const storage = rememberMe ? localStorage : sessionStorage;
        const otherStorage = rememberMe ? sessionStorage : localStorage;
        otherStorage.removeItem('travel_auth_token');
        storage.setItem('travel_auth_user', JSON.stringify(loggedInUser));
        storage.setItem('travel_onboarding_complete', 'true');
        storage.setItem('travel_auth_token', retry.resp.token);
        setToken(retry.resp.token);
        return true;
      }

    }

    return false;
  };

  // const loginWithGoogle = async (): Promise<boolean> => {
  //   try {
  //     // Redirect to Google OAuth
  //     const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ;
  //     const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  //     const scope = 'openid email profile';
  //     const responseType = 'code';

  //     const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  //       `client_id=${encodeURIComponent(clientId)}&` +
  //       `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  //       `scope=${encodeURIComponent(scope)}&` +
  //       `response_type=${responseType}&` +
  //       `access_type=offline&` +
  //       `prompt=consent`;

  //     // Store current location for redirect after auth
  //     sessionStorage.setItem('auth_redirect', window.location.pathname);

  //     // Redirect to Google OAuth
  //     window.location.href = authUrl;
  //     return true; // This won't execute due to redirect
  //   } catch (error) {
  //     console.error('Google OAuth error:', error);
  //     return false;
  //   }
  // };

const loginWithGoogle = async (): Promise<boolean> => {
  try {
    // Store current location for redirect after auth
    sessionStorage.setItem('auth_redirect', window.location.pathname);
    
    // Redirect to backend (relative path handles proxy in dev and same-origin in prod)
    window.location.href = `/api/auth/google`;
    return true;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return false;
  }
};

  const handleGoogleCallback = async (code: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // Exchange authorization code for tokens
      const { authApi } = await import('../lib/api');
      const response = await authApi.googleAuth(code);

      if (response.success && response.user) {
        const user = response.user;
        const loggedInUser = {
          id: user.id || user._id,
          email: user.email,
          firstName: user.firstName || user.name?.split(' ')[0] || user.fullname?.split(' ')[0] || '',
          lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || user.fullname?.split(' ').slice(1).join(' ') || '',
          userType: (user.userType as any)?.toLowerCase() as 'user' | 'vendor',
          vendorStatus: (user as any).vendorStatus
        };

        setUser(loggedInUser);
        setIsAuthenticated(true);
        setNeedsOnboarding(false);
        localStorage.setItem('travel_auth_user', JSON.stringify(loggedInUser));
        localStorage.setItem('travel_onboarding_complete', 'true');
        localStorage.setItem('travel_auth_token', response.token);
        setToken(response.token);

        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error: any) {
      console.error('Google callback error:', error);
      return { success: false, message: error.message || 'Google login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setNeedsOnboarding(false);
    localStorage.removeItem('travel_auth_user');
    localStorage.removeItem('travel_onboarding_complete');
    localStorage.removeItem('travel_auth_token');
    
    sessionStorage.removeItem('travel_auth_user');
    sessionStorage.removeItem('travel_onboarding_complete');
    sessionStorage.removeItem('travel_auth_token');
    setToken(null);
  };

  const register = async (
    data: RegisterData,
  ): Promise<{ ok: boolean; registerId?: string; code?: number; message?: string }> => {
    try {
      const { authApi } = await import('../lib/api');
      const res = await authApi.register({
        userType: data.userType,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        country: data.country,
        state: data.state,
        city: data.city,
        email: data.email,
        mobile: data.mobile,
        password: data.password,
      } as any);
      const regId = (res as any).registerId as string;
      const otp = (res as any).otp as string;
      if (otp) {
        console.log("------------------------------------------");
        console.log(`DEBUG: RECEIVED OTP FROM SERVER: ${otp}`);
        console.log("------------------------------------------");
      }
      if (regId) sessionStorage.setItem('reg_register_id', regId);
      setLastRegisterId(regId || null);
      return { ok: true, registerId: regId };
    } catch (e: any) {
      const msg = String(e?.message || '');
      const m = msg.match(/^HTTP\s+(\d+)/);
      const code = m ? Number(m[1]) : undefined;
      console.log(`Code otp-- ${code}: ${msg}`)
      return { ok: false, code, message: msg };
    }
  };

  // TODO: Remove static OTP bypass before production — temporary for development/testing
  const STATIC_OTP = '123456';

  const verifyOTP = async (otp: string): Promise<boolean> => {
    try {
      if (!lastRegisterId) return false;

      // TODO: Remove this static OTP check before production
      if (otp === STATIC_OTP) {
        console.log('DEV: Static OTP accepted — skipping server verification');
        return true;
      }

      const { authApi } = await import('../lib/api');
      const resp = await authApi.verifyRegisterOtp(lastRegisterId, otp);
      return !!resp.success;
    } catch {
      return false;
    }
  };

  // const authenticateAfterRegister = (u: Partial<User> & { email: string }) => {
  //   const newUser: User = {
  //     id: u.id || 'reg',
  //     email: u.email,
  //     firstName: u.firstName || '',
  //     lastName: u.lastName || '',
  //     userType: ((u.userType as any)?.toLowerCase() as 'user' | 'vendor') || 'user',
  //     photo: u.photo,
  //     phoneNumber: u.phoneNumber,
  //     state: u.state,
  //     city: u.city,
  //     idProof: u.idProof,
  //     dateOfBirth: u.dateOfBirth,
  //   };
  //   setUser(newUser);
  //   setIsAuthenticated(true);
  //   setNeedsOnboarding(false);
  //   localStorage.setItem('travel_auth_user', JSON.stringify(newUser));
  //   localStorage.setItem('travel_onboarding_complete', 'true');
  // };
const authenticateAfterRegister = (u: Partial<User> & { email: string }) => {
  console.log('Authenticating user after register:', u); // Debug log
  
  const newUser: User = {
    id: u.id || 'reg',
    email: u.email,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    userType: ((u.userType as any)?.toLowerCase() as 'user' | 'vendor') || 'user',
    photo: u.photo,
    phoneNumber: u.phoneNumber,
    state: u.state,
    city: u.city,
    idProof: u.idProof,
    dateOfBirth: u.dateOfBirth,
  };
  
  // Update state
  setUser(newUser);
  setIsAuthenticated(true);
  setNeedsOnboarding(false);
  
  const storedToken = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
  if (storedToken) {
    setToken(storedToken);
  }
  
  // Store in localStorage
  localStorage.setItem('travel_auth_user', JSON.stringify(newUser));
  localStorage.setItem('travel_onboarding_complete', 'true');
  
  // Also store token if available (token should already be stored)
  console.log('User authenticated successfully:', newUser);
  console.log('isAuthenticated set to:', true);
};


  const completeOnboarding = () => {
    setNeedsOnboarding(false);
    if (localStorage.getItem('travel_auth_user')) {
      localStorage.setItem('travel_onboarding_complete', 'true');
    } else {
      sessionStorage.setItem('travel_onboarding_complete', 'true');
    }
  };

  const updateUserType = async (userType: 'user' | 'vendor') => {
    if (user) {
      const updatedUser = { ...user, userType };
      setUser(updatedUser);
      setNeedsOnboarding(false);
      lastUserTypeUpdateAt.current = Date.now();
      
      const storage = localStorage.getItem('travel_auth_user') ? localStorage : sessionStorage;
      storage.setItem('travel_auth_user', JSON.stringify(updatedUser));
      storage.setItem('travel_onboarding_complete', 'true');

      // Also try to update on server so it persists
      try {
        const { userProfileApi } = await import('../lib/api');
        await userProfileApi.upsert({ email: user.email, userType });
      } catch (error) {
        console.error('Failed to update userType on server:', error);
      }
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      if (localStorage.getItem('travel_auth_user')) {
        localStorage.setItem('travel_auth_user', JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem('travel_auth_user', JSON.stringify(updatedUser));
      }
    }
  };

  const refreshUser = async () => {
    if (!user?.email) return;
    try {
      const { userProfileApi } = await import('../lib/api');
      const res = await userProfileApi.get(user.email);
      console.log('[AUTH] refreshUser response:', { vendorStatus: res?.data?.vendorStatus, userType: res?.data?.userType });
      if (res?.success && res.data) {
        const p = res.data;
        
        // If we recently updated userType locally, don't let the server overwrite it
        // until enough time has passed for the server to have the updated value
        const isRecentlyUpdated = (Date.now() - lastUserTypeUpdateAt.current) < 10000; // 10 seconds
        let effectiveUserType = isRecentlyUpdated ? user.userType : ((p as any).userType || user.userType);

        // Auto-promote to vendor if admin has approved
        const vs = (p as any).vendorStatus;
        if ((vs === 'approved' || vs === 'active') && effectiveUserType !== 'vendor') {
          effectiveUserType = 'vendor';
        }

        const updatedUser: User = {
          ...user,
          firstName: p.firstName || user.firstName,
          lastName: p.lastName || user.lastName,
          userType: effectiveUserType,
          vendorStatus: (p as any).vendorStatus,
          photo: p.photo,
          phoneNumber: p.phoneNumber,
          mobileVerified: p.mobileVerified,
          emailVerified: p.emailVerified,
          state: p.state,
          city: p.city,
          idProof: p.idProof,
          dateOfBirth: p.dateOfBirth,
        };
        setUser(updatedUser);
        if (localStorage.getItem('travel_auth_user')) {
          localStorage.setItem('travel_auth_user', JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem('travel_auth_user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  // Keep ref in sync so the visibilitychange listener always calls the latest version
  refreshUserRef.current = refreshUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        needsOnboarding,
        login,
        loginWithGoogle,
        handleGoogleCallback,
        logout,
        register,
        verifyOTP,
        completeOnboarding,
        updateUserType,
        updateUser,
        refreshUser,
        lastRegisterId,
        authenticateAfterRegister,
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

// export { DEMO_CREDENTIALS };
