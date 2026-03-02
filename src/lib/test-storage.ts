import { storage } from './firebase';
import { ref, listAll } from 'firebase/storage';

export const verifyStorage = async () => {
    try {
        const storageRef = ref(storage);
        // This will attempt to list files in the root (likely empty, but tests connection)
        await listAll(storageRef);
        console.log("✅ Firebase Storage connected successfully!");
        return true;
    } catch (error: any) {
        console.error("❌ Firebase Storage connection failed:", error.message);
        return false;
    }
};
