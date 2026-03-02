'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    role: UserRole | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    role: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<UserRole | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            const fetchUser = async () => {
                if (firebaseUser) {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data() as User;
                            setUser(userData);
                            setRole(userData.role);
                        } else {
                            setUser(null);
                            setRole(null);
                        }
                    } catch (error) {
                        setUser(null);
                        setRole(null);
                    }
                } else {
                    setUser(null);
                    setRole(null);
                }
                setLoading(false);
            };
            fetchUser();
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, role }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
