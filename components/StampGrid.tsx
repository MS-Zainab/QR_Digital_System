"use client";

import { motion } from "framer-motion";
import { Coffee, Scissors, ShoppingBag, Utensils, Lock } from "lucide-react";
import type { BusinessType } from "@/lib/types";

const ICONS: Record<BusinessType, React.ElementType> = {
  cafe: Coffee,
  restaurant: Utensils,
  salon: Scissors,
  retail: ShoppingBag,
};

export default function StampGrid({
  count,
  required,
  color,
  businessType,
}: {
  count: number;
  required: number;
  color: string;
  businessType: BusinessType;
}) {
  const Icon = ICONS[businessType] ?? Coffee;

  return (
    <div className="grid grid-cols-5 gap-3 px-4 pb-4">
      {Array.from({ length: required }).map((_, i) => {
        const earned = i < count;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: earned ? 1 : 0.95,
              opacity: 1,
            }}
            transition={{
              delay: i * 0.05,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="aspect-square rounded-2xl flex items-center justify-center relative"
            style={{
              background: earned
                ? `linear-gradient(135deg, ${color}, ${color}dd)`
                : "white",
              border: earned ? "none" : `2px dashed ${color}40`,
              boxShadow: earned
                ? `0 4px 12px ${color}40, inset 0 -2px 6px rgba(0,0,0,0.1)`
                : "none",
            }}
          >
            {earned ? (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: i * 0.05 + 0.2,
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                }}
              >
                <Icon size={22} className="text-white" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <Lock size={16} style={{ color: `${color}40` }} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}