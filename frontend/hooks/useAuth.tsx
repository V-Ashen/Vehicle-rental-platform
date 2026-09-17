"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { apiClient } from '../lib/api';

type AuthContextType = {
  user: User | null;
  dbUser: any | null; // Database user document
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, dbUser: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Call login endpoint to fetch the synced DB user profile
          const res = await apiClient.post('/auth/login');
          setDbUser(res.data.data);
        } catch (error) {
          console.error("Failed to fetch DB user", error);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, dbUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
