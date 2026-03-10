'use client';

import React from 'react';
import Image from 'next/image';
import { Shield } from 'lucide-react';
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
    width = 40,
    height = 40,
    className,
    iconOnly = false,
    showText = true,
    light = false
}: LogoProps) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div
                className={cn(
                    "relative flex items-center justify-center rounded-2xl overflow-hidden transition-all duration-500",
                    light ? "bg-white/5" : "bg-transparent"
                )}
                style={{ width, height }}
            >
                {/* 
                    Trying to load the logo image. 
                    If it fails, we fallback to the Shield icon.
                */}
                <Image
                    src="/logo_premium.png"
                    alt="Nivaro Health Logo"
                    width={width}
                    height={height}
                    className="object-contain" // Sharp containment
                    priority
                    quality={100} // Force maximum quality
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <Shield
                    className={cn(
                        "absolute w-1/2 h-1/2 text-white transition-opacity duration-300",
                        "pointer-events-none"
                    )}
                    style={{ opacity: 0 }} // Hidden by default, can be shown if needed
                />
            </div>

            {!iconOnly && showText && (
                <div className="flex flex-col">
                    <span className={cn(
                        "font-display font-black tracking-tight leading-none uppercase",
                        light ? "text-white" : "text-primary",
                        width > 40 ? "text-2xl" : "text-xl"
                    )}>
                        NIVARO <span className={light ? "text-white/80" : "text-secondary"}>HEALTH</span>
                    </span>
                    <span className={cn(
                        "text-[8px] font-bold uppercase tracking-[0.3em] mt-1",
                        light ? "text-white/40" : "text-slate-500"
                    )}>
                        Health OS
                    </span>
                </div>
            )}
        </div>
    );
}
