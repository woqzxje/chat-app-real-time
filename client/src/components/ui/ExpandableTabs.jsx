"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".375rem",
    paddingRight: ".375rem",
  },
  animate: (isHovered) => ({
    gap: isHovered ? ".375rem" : 0,
    paddingLeft: isHovered ? ".75rem" : ".375rem",
    paddingRight: isHovered ? ".75rem" : ".375rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.05, type: "spring", bounce: 0, duration: 0.5 };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-cyan-400",
}) {
  const [hovered, setHovered] = React.useState(null);

  const Separator = () => (
    <div className="mx-1 h-[18px] w-[1px] bg-white/20" aria-hidden="true" />
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-2xl border border-white/5 bg-[#0e2230]/30 backdrop-blur-xl p-1 shadow-sm",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={hovered === index}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => { if(tab.onClick) tab.onClick(); }}
            transition={transition}
            className={cn(
              "relative flex items-center rounded-xl px-3 py-1.5 text-xs font-medium transition-colors duration-300",
              hovered === index
                ? cn("bg-white/10", activeColor)
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon size={18} />
            <AnimatePresence initial={false}>
              {hovered === index && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
