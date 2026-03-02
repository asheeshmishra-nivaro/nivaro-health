import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { UserRole } from '@/types';

export async function POST(request: Request) {
    try {
        const { name, email, role, nodeId, tempPassword, adminUid } = await request.json();

        // 1. Verify Requesting User is an ADMIN
        const adminRef = await adminDb.collection('users').doc(adminUid).get();
        const adminData = adminRef.data();

        if (!adminData || adminData.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
        }

        // 2. Create User in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password: tempPassword,
            displayName: name,
        });

        // 3. Create User Profile in Firestore
        const userData = {
            uid: userRecord.uid,
            name,
            email,
            role: role as UserRole,
            nodeId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await adminDb.collection('users').doc(userRecord.uid).set(userData);

        // 4. Log Activity
        await adminDb.collection('activityLogs').add({
            userId: adminUid,
            userName: adminData.name,
            userRole: 'ADMIN',
            action: 'USER_CREATION',
            details: `Created ${role} user: ${name} (${email}) for node: ${nodeId}`,
            nodeId: adminData.nodeId,
            timestamp: new Date(),
        });

        return NextResponse.json({ success: true, uid: userRecord.uid });
    } catch (error: any) {
        console.error('User creation error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
    }
}
