"use client";

import { motion, type Variants } from "framer-motion";
import React, { ReactNode } from "react";

const VIEWPORT = { once: true, amount: 0.7 } as const;

const defaultVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -40,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5, // Individual character animation duration
      ease: [0.22, 1, 0.36, 1], // Smooth cubic-bezier spring-like ease
    },
  },
};
export const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};
export const defaultWordVariants: Variants = {
  hidden: { opacity: 0, y: -30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};
export const defaultCharVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -40, // Increased distance for a distinct fly-down effect
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5, // Individual character animation duration
      ease: [0.22, 1, 0.36, 1], // Smooth cubic-bezier spring-like ease
    },
  },
};
type Props = {
  children: ReactNode;
  variants?: Variants;
  delay?: number;
  className?: string;
  duration?: number;
  staggerChildren?: number;
};

export const AnimateOnScroll = ({
  children,
  variants,
  delay = 0,
  className,
  duration,
}: Props) => {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className={className}
      transition={{
        duration: 0.95,
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * TextSplitter - Character-level & Word-level animated text splitter
 */
export const TextSplitter = ({
  text,
  className,
  wordClassName,
  charClassName,
  charVariants = defaultCharVariants,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  charClassName?: string;
  charVariants?: Variants;
}) => {
  const words = text.split(" ");

  return (
    <span
      className={className}
      style={{ display: "inline-flex", flexWrap: "wrap", gap: "0.25em" }}
    >
      {words.map((word, wordIdx) => (
        <span
          key={wordIdx}
          className={wordClassName}
          style={{ display: "inline-block", whiteSpace: "nowrap" }}
        >
          {Array.from(word).map((char, charIdx) => (
            <motion.span
              key={charIdx}
              variants={charVariants}
              className={charClassName}
              style={{ display: "inline-block" }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
};
