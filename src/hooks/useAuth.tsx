'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/client';
import { nowIso } from '@/lib/firebase/firestore';
import type { Profile } from '@/types';

// Minimal shape kept compatible with the rest of the app, which reads
// `user.id` (a Supabase-ism). Firebase's User exposes `.uid` instead, so we
// adapt it here once rather than touching every call site.
interface AuthUser {
  id: string;
  email: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ id: firebaseUser.uid, email: firebaseUser.email });
        getDoc(doc(db, 'users', firebaseUser.uid)).then((snap) => {
          if (snap.exists()) setProfile(snap.data() as Profile);
        });
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch {
      return { error: 'Invalid email or password.' };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    // Firestore rules require auth to read `users`, so the account has to
    // exist before we can check username uniqueness. If it's taken, roll
    // the just-created auth account back.
    let credential;
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        return { error: 'An account with this email already exists.' };
      }
      return { error: err.message || 'Failed to create account.' };
    }

    try {
      const existing = await getDocs(
        query(collection(db, 'users'), where('username', '==', username), limit(1))
      );
      if (!existing.empty) {
        await deleteUser(credential.user);
        return { error: 'Username is already taken.' };
      }

      const timestamp = nowIso();
      const newProfile: Profile = {
        id: credential.user.uid,
        username,
        email,
        avatar_emoji: '😎',
        accent_color: 'purple',
        created_at: timestamp,
        updated_at: timestamp,
      };
      await setDoc(doc(db, 'users', credential.user.uid), newProfile);
      return { error: null };
    } catch (err: any) {
      await deleteUser(credential.user).catch(() => {});
      return { error: err.message || 'Failed to create account.' };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      await updateDoc(doc(db, 'users', user.id), {
        ...updates,
        updated_at: nowIso(),
      });
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to update profile.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
