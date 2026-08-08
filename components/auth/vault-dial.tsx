"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type VaultDialState = "idle" | "unlocking" | "unlocked";

const TICK_COUNT = 48;

function Ticks({ radius, majorEvery = 6 }: { radius: number; majorEvery?: number }) {
  return (
    <>
      {Array.from({ length: TICK_COUNT }).map((_, i) => {
        const angle = (i / TICK_COUNT) * 360;
        const isMajor = i % majorEvery === 0;
        return (
          <line
            key={i}
            x1="0"
            y1={-radius}
            x2="0"
            y2={-radius + (isMajor ? 14 : 7)}
            stroke="currentColor"
            strokeWidth={isMajor ? 1.5 : 1}
            strokeLinecap="round"
            transform={`rotate(${angle})`}
            opacity={isMajor ? 0.85 : 0.35}
          />
        );
      })}
    </>
  );
}

export function VaultDial({
  state = "idle",
  className,
}: {
  state?: VaultDialState;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      <motion.svg
        viewBox="-160 -160 320 320"
        className="absolute inset-0 h-full w-full text-vault-gold"
        animate={
          state === "idle"
            ? { rotate: 360 }
            : state === "unlocking"
              ? { rotate: [0, -18, 340] }
              : { rotate: 0 }
        }
        transition={
          state === "idle"
            ? { duration: 120, repeat: Infinity, ease: "linear" }
            : state === "unlocking"
              ? { duration: 1.1, ease: "easeInOut" }
              : { duration: 0.4 }
        }
      >
        <circle
          r="150"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1"
        />
        <g className="text-vault-gold">
          <Ticks radius={150} />
        </g>
        <circle
          r="112"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
        <circle
          r="76"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
      </motion.svg>

      <motion.svg
        viewBox="-160 -160 320 320"
        className="absolute inset-0 h-full w-full text-vault-steel"
        animate={{ rotate: -360 }}
        transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
      >
        <circle
          r="132"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="0.75"
          strokeDasharray="1 7"
        />
      </motion.svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="flex h-14 w-14 items-center justify-center rounded-full border border-vault-gold/40 bg-ink-elevated shadow-[0_0_40px_-10px_rgba(201,169,97,0.5)]"
          animate={
            state === "unlocked"
              ? { scale: [1, 1.15, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 0.5 }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            className="text-vault-gold-bright"
          >
            <motion.path
              d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm0 2a3 3 0 0 1 3 3v3H9V7a3 3 0 0 1 3-3Z"
              fill="currentColor"
              animate={
                state === "unlocked"
                  ? { d: "M12 2a5 5 0 0 0-5 5v1H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8V7a3 3 0 0 1 6 0 1 1 0 1 0 2 0 5 5 0 0 0-5-5Z" }
                  : {}
              }
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
