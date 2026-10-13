"use client";

import { motion } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";

export default function RewardProgress({
  count,
  required,
  color,
  rewardDescription,
}: {
  count: number;
  required: number;
  color: string;
  rewardDescription: string;
}) {
  const progress = Math.min((count / required) * 100, 100);
  const remaining = Math.max(required - count, 0);
  const isComplete = remaining === 0;

  return (
    <div className="px-4 pt-4 pb-2">
      {isComplete ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3 p-3 rounded-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          }}
        >
          {/* Shimmer */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
          <Sparkles className="text-white shrink-0 relative" size={20} />
          <div className="relative">
            <p className="text-white font-bold text-sm">Reward Unlocked! 🎉</p>
            <p className="text-white/90 text-xs">{rewardDescription}</p>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <Gift size={14} style={{ color }} />
              <span className="text-xs font-medium text-gray-600">
                {rewardDescription}
              </span>
            </div>
            <span
              className="text-xs font-bold"
              style={{ color }}
            >
              {remaining} to go
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}