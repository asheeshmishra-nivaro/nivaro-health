'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Consultation } from '@/types';

export function useConsultationQueue(nodeId: string | undefined, doctorId?: string) {
    const [queue, setQueue] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!nodeId) return;

        const consultRef = collection(db, 'consultations');

        // Base statuses for doctor or operator
        const activeStatuses = ['pending', 'doctor-assigned', 'active'];

        let q = query(
            consultRef,
            where('status', 'in', activeStatuses),
            orderBy('createdAt', 'asc')
        );

        if (nodeId !== 'GLOBAL') {
            if (doctorId) {
                // Doctor specific query for their node
                q = query(
                    consultRef,
                    where('nodeId', '==', nodeId),
                    where('doctorId', '==', doctorId),
                    where('status', 'in', activeStatuses),
                    orderBy('createdAt', 'asc')
                );
            } else {
                // Operator specific query for their node
                q = query(
                    consultRef,
                    where('nodeId', '==', nodeId),
                    where('status', 'in', activeStatuses),
                    orderBy('createdAt', 'asc')
                );
            }
        } else if (doctorId) {
            // Global doctor query (if doctors move between nodes)
            q = query(
                consultRef,
                where('doctorId', '==', doctorId),
                where('status', 'in', activeStatuses),
                orderBy('createdAt', 'asc')
            );
        }

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
    }, [nodeId, doctorId]);

    return { queue, loading };
}
