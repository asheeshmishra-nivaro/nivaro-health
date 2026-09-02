'use client';

import React, { useState, useEffect } from 'react';
import {
    Camera,
    Mic,
    MicOff,
    Video,
    VideoOff,
    PhoneOff,
    Maximize2,
    MessageSquare,
    Users,
    Shield,
    Clock,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VideoEngineProps {
    sessionId: string;
    patientName: string;
    onEnd: () => void;
    role: 'DOCTOR' | 'OPERATOR';
    mode?: 'overlay' | 'inline';
}

export default function VideoEngine({ sessionId, patientName, onEnd, role, mode = 'overlay' }: VideoEngineProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [duration, setDuration] = useState(0);
    const [status, setStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');

    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);

        // Simulate connection
        setTimeout(() => setStatus('active'), 2000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={cn(
            "bg-slate-950 flex flex-col items-center justify-center overflow-hidden transition-all duration-700 relative",
            mode === 'overlay' ? "fixed inset-0 z-[100]" : "w-full h-full min-h-[400px] rounded-[3rem] border border-white/5"
        )}>
            {/* Connection Overlay */}
            {status === 'connecting' && (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Initializing Uplink...</p>
                    </div>
                </div>
            )}

            {/* Immersive Video Canvas */}
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Remote Stream Shell */}
                <div className="absolute inset-0 bg-slate-900 overflow-hidden">
                    {isVideoOff ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                <Users className="w-10 h-10 text-slate-500" />
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Video Paused</p>
                        </div>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                            <motion.div
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="text-slate-700 font-display font-black text-9xl opacity-10 select-none"
                            >
                                NIVARO STREAM
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Local Stream (PIP) */}
                <motion.div
                    drag
                    dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 w-36 h-28 sm:w-44 sm:h-32 bg-slate-800 rounded-2xl border-2 border-white/10 shadow-2xl overflow-hidden cursor-move z-10"
                >
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-sm">
                        <Camera className="w-5 h-5 text-white/20 mb-1" />
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Local Feed</p>
                    </div>
                </motion.div>

                {/* Clinical Interface Overlay */}
                <div className="absolute inset-0 p-4 sm:p-6 pointer-events-none flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 pointer-events-auto"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <h2 className="text-xl font-display font-bold text-white tracking-tight">{patientName}</h2>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest">
                                    <Clock className="w-4 h-4" /> {formatTime(duration)}
                                </div>
                                <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest">
                                    <Shield className="w-4 h-4 text-emerald-500" /> Encrypted
                                </div>
                            </div>
                        </motion.div>

                        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-white/10 pointer-events-auto">
                            <div className="p-2 bg-indigo-500/20 rounded-xl">
                                <Users className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">Uplink Mode</p>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">{mode === 'inline' ? 'Direct Console' : 'Overlay Mode'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Floating Centered Bottom Control Bar */}
                    <div className="flex justify-center pb-2">
                        <div className="flex items-center gap-6 p-5 bg-white/10 backdrop-blur-3xl rounded-[3rem] border border-white/10 pointer-events-auto shadow-2xl">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={cn(
                                    "p-5 rounded-full transition-all hover:scale-110 active:scale-95",
                                    isMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-white/10 text-white hover:bg-white/20"
                                )}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                className={cn(
                                    "p-5 rounded-full transition-all hover:scale-110 active:scale-95",
                                    isVideoOff ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-white/10 text-white hover:bg-white/20"
                                )}
                            >
                                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                            </button>

                            <button className="p-5 bg-white/10 text-white rounded-full hover:bg-white/20 hover:scale-110 active:scale-95 transition-all">
                                <Maximize2 className="w-6 h-6" />
                            </button>

                            <div className="w-px h-8 bg-white/10 mx-2" />

                            <button
                                onClick={onEnd}
                                className="p-6 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-2xl shadow-red-600/40 hover:scale-110 active:scale-95 ring-8 ring-red-600/10"
                            >
                                <PhoneOff className="w-8 h-8" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
