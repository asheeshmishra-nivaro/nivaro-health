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

interface VideoEngineProps {
    sessionId: string;
    patientName: string;
    onEnd: () => void;
    role: 'DOCTOR' | 'OPERATOR';
}

export default function VideoEngine({ sessionId, patientName, onEnd, role }: VideoEngineProps) {
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
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
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
                    dragConstraints={{ left: -400, right: 400, top: -300, bottom: 300 }}
                    className="absolute bottom-10 right-10 w-64 h-48 bg-slate-800 rounded-3xl border-2 border-white/10 shadow-2xl overflow-hidden cursor-move z-10"
                >
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-sm">
                        <Camera className="w-8 h-8 text-white/20 mb-2" />
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Local Feed</p>
                    </div>
                </motion.div>

                {/* Clinical Interface Overlay */}
                <div className="absolute inset-0 p-8 pointer-events-none flex flex-col justify-between">
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
                                <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest">
                                    <Clock className="w-4 h-4" /> {formatTime(duration)}
                                </div>
                                <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest">
                                    <Shield className="w-4 h-4 text-emerald-500" /> Encrypted
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-white/10 pointer-events-auto"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <Users className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-white/40 uppercase">Assigned Node</p>
                                    <p className="text-xs font-bold text-white">UP-WEST DISTRICT 04</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Controls Dock */}
                    <div className="flex flex-col items-center gap-6">
                        <AnimatePresence>
                            {status === 'connecting' && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    className="bg-indigo-500 px-6 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                                >
                                    Establishing Clinical Link...
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 pointer-events-auto">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={onEnd}
                                className="mx-4 p-5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-2xl shadow-red-600/30 ring-8 ring-red-600/10"
                            >
                                <PhoneOff className="w-8 h-8" />
                            </button>

                            <button className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all">
                                <MessageSquare className="w-6 h-6" />
                            </button>

                            <button className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all">
                                <Maximize2 className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
