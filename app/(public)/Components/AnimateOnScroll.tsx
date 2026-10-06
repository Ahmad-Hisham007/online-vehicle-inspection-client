"use client";

import { motion, type Variants } from "framer-motion";
import React, { ReactNode } from "react";

const VIEWPORT = { once: true, amount: 0.7, margin: "-100px" } as const;

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

export const defaultLineContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

export const defaultLineVariants: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
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
  customView?: { once: boolean; amount: number; margin: string };
};

export const AnimateOnScroll = ({
  children,
  variants,
  delay = 0,
  className,
  duration,
  customView,
}: Props) => {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={customView ? customView : VIEWPORT}
      className={`${className} transform-gpu`}
      transition={{
        duration: 0.95,
      }}
      style={{ willChange: "transform, opacity" }}
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

/**
 * AutoLineSplitter - Dynamic responsive text reveal from bottom.
 * Wraps individual words in masked inline-blocks so lines wrap naturally on screen resize.
 */
export const AutoLineSplitter = ({
  text,
  className,
  wordClassName,
  containerVariants = defaultLineContainerVariants,
  wordVariants = defaultLineVariants,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  containerVariants?: Variants;
  wordVariants?: Variants;
}) => {
  const words = text.split(" ");

  return (
    <motion.p
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className={className}
    >
      {words.map((word, idx) => (
        <span
          key={idx}
          style={{
            display: "inline-block",
            overflow: "hidden",
            verticalAlign: "top",
            paddingBottom: "0.1em", // Prevents letter descenders (p, g, y) from getting clipped
          }}
        >
          <motion.span
            variants={wordVariants}
            className={wordClassName}
            style={{ display: "inline-block", paddingRight: "0.28em" }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.p>
  );
};
