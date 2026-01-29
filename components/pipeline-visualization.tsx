"use client";

import { motion } from "framer-motion";
import {
    Upload,
    FileText,
    Scissors,
    Cpu,
    Database,
    Bot,
    CheckCircle2,
    LucideIcon
} from "lucide-react";

export function PipelineVisualization() {
    const steps = [
        { icon: Upload, color: "bg-blue-500", delay: 0 },
        { icon: FileText, color: "bg-indigo-500", delay: 0.2 },
        { icon: Scissors, color: "bg-purple-500", delay: 0.4 },
        { icon: Cpu, color: "bg-pink-500", delay: 0.6 },
        { icon: Database, color: "bg-orange-500", delay: 0.8 },
        { icon: Bot, color: "bg-green-500", delay: 1.0 },
        { icon: CheckCircle2, color: "bg-emerald-500", delay: 1.2 },
    ];

    const FinalIcon = steps[6].icon;

    return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center p-8 bg-slate-50/50 rounded-3xl border border-slate-100">
            <div className="relative w-full max-w-lg">
                {/* Connection Lines - S-Shape / Snake Layout */}
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
                    <motion.path
                        d="M 50 50 L 250 50 L 450 50 L 450 150 L 250 150 L 50 150 L 50 250 L 250 250"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="4"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                </svg>

                <div className="grid grid-cols-3 gap-y-16 gap-x-8 relative z-10">
                    {/* Row 1: Left to Right */}
                    <div className="flex justify-center">
                        <Node step={steps[0]} />
                    </div>
                    <div className="flex justify-center">
                        <Node step={steps[1]} />
                    </div>
                    <div className="flex justify-center">
                        <Node step={steps[2]} />
                    </div>

                    {/* Row 2: Right to Left */}
                    <div className="flex justify-center order-last sm:order-none col-start-3">
                        <div className="absolute right-0 "></div> {/* Spacer */}
                    </div>
                    <div className="flex justify-center col-start-3 row-start-2">
                        <Node step={steps[3]} />
                    </div>
                    <div className="flex justify-center col-start-2 row-start-2">
                        <Node step={steps[4]} />
                    </div>
                    <div className="flex justify-center col-start-1 row-start-2">
                        <Node step={steps[5]} />
                    </div>

                    {/* Row 3: Final Result */}
                    <div className="col-span-3 flex justify-center mt-4">
                        <div className="relative">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                whileInView={{ scale: 1.5, rotate: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20,
                                    delay: steps[6].delay
                                }}
                                className={`w-20 h-20 rounded-full ${steps[6].color} flex items-center justify-center shadow-lg shadow-emerald-200 ring-4 ring-white relative z-10`}
                            >
                                <FinalIcon className="w-10 h-10 text-white" />
                            </motion.div>
                            {/* Pulsing effect */}
                            <motion.div
                                className={`absolute inset-0 rounded-full ${steps[6].color} opacity-20`}
                                animate={{ scale: [1.5, 2.5], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Node({ step }: { step: { icon: LucideIcon, color: string, delay: number } }) {
    const Icon = step.icon;
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: step.delay
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-lg ring-4 ring-white z-10 transition-shadow hover:shadow-xl`}
        >
            <Icon className="w-8 h-8 text-white" />
        </motion.div>
    );
}
