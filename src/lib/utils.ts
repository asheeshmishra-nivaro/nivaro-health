import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: any) {
    if (!date) return 'N/A';
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date instanceof Date) return date.toLocaleDateString();
    return new Date(date).toLocaleDateString();
}

export function formatDateTime(date: any) {
    if (!date) return 'N/A';
    if (date.toDate) return date.toDate().toLocaleString();
    if (date instanceof Date) return date.toLocaleString();
    return new Date(date).toLocaleString();
}
