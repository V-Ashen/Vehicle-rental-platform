"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { apiClient } from '../lib/api';

type AuthContextType = {
  user: User | null;
  dbUser: any | null; // Database user document
  tenant: any | null; // Tenant document (for owners)
  subscription: any | null; // Subscription document (for owners)
  activePackage: any | null; // The tenant's active package with features
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  dbUser: null, 
  tenant: null,
  subscription: null,
  activePackage: null,
  loading: true 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [tenant, setTenant] = useState<any | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [activePackage, setActivePackage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Call login endpoint to fetch the synced DB user profile
          const res = await apiClient.post('/auth/login');
          const payload = res.data.data;
          
          setDbUser(payload.user || null);
          setTenant(payload.tenant || null);
          setSubscription(payload.subscription || null);
          setActivePackage(payload.activePackage || null);
        } catch (error) {
          console.error("Failed to fetch DB user", error);
          // If the DB user is suspended or not found, forcefully sign out
          // to prevent an infinite redirect loop.
          await auth.signOut();
          setDbUser(null);
          setTenant(null);
          setSubscription(null);
          setActivePackage(null);
        }
      } else {
        setDbUser(null);
        setTenant(null);
        setSubscription(null);
        setActivePackage(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, dbUser, tenant, subscription, activePackage, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
