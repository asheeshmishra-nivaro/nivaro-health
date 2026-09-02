'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
    width?: number;
    height?: number;
    className?: string;
    iconOnly?: boolean;
    showText?: boolean;
    light?: boolean;
}

export default function Logo({
    width,
    height,
    className,
    iconOnly = false,
    showText = true,
    light = false
}: LogoProps) {
    if (iconOnly) {
        return (
            <div className={cn("inline-flex items-center", className)}>
                <Image
                    src="/logo_icon.png"
                    alt="Nivaro Health Icon"
                    width={width || 42}
                    height={height || 42}
                    className={cn(
                        "object-contain transition-transform duration-300 hover:scale-105",
                        light ? "brightness-0 invert" : ""
                    )}
                    priority
                    quality={100}
                />
            </div>
        );
    }

    return (
        <div className={cn("inline-flex items-center", className)}>
            <Image
                src="/logo_full.png"
                alt="Nivaro Health Technologies"
                width={width || 190}
                height={height || 50}
                className={cn(
                    "object-contain h-10 sm:h-12 w-auto max-w-[200px] sm:max-w-[220px] transition-transform duration-300 hover:opacity-95",
                    light ? "brightness-0 invert opacity-90" : ""
                )}
                priority
                quality={100}
            />
        </div>
    );
}
