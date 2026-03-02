'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Consultation } from '@/types';

export function useConsultationQueue(nodeId: string | undefined) {
    const [queue, setQueue] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!nodeId) return;

        const q = query(
            collection(db, 'consultations'),
            where('nodeId', '==', nodeId),
            where('status', 'in', ['pending', 'in-progress']),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const consultations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Consultation[];
            setQueue(consultations);
            setLoading(false);
        }, (error) => {
            console.error('Queue listener error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [nodeId]);

    return { queue, loading };
}
