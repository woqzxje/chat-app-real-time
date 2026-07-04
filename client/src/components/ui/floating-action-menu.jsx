"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";
import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";

const FloatingActionMenu = ({
  options,
  className,
  disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={menuRef} className={cn("relative flex items-center justify-center", className)}>
      <button
        onClick={toggleMenu}
        disabled={disabled}
        className="w-8 h-8 rounded-full bg-gray-100/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <Plus className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 0, y: 10, filter: "blur(5px)" }}
            animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 0, y: 10, filter: "blur(5px)" }}
            transition={{
              duration: 0.4,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="absolute bottom-full right-0 mb-3 z-50 min-w-[140px]"
          >
            <div className="flex flex-col items-end gap-2">
              {options.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                  }}
                  className="w-full"
                >
                  <Button
                    onClick={() => {
                      option.onClick();
                      setIsOpen(false);
                    }}
                    size="sm"
                    className="w-full flex items-center justify-start gap-2.5 bg-[#1e293b] hover:bg-[#334155] text-gray-200 hover:text-white shadow-xl border border-white/10 rounded-xl backdrop-blur-sm cursor-pointer"
                  >
                    {option.Icon}
                    <span className="font-medium text-xs">{option.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingActionMenu;
