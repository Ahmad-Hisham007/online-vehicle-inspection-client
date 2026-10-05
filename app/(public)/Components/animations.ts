import { type Variants, type Transition } from "framer-motion";

export const VIEWPORT = { once: true, margin: "-60px" } as const;

export const smoothEase = [0.16, 1, 0.3, 1] as const;

// Helper to safely append custom duration/delay to static variant objects without functions
export const withTransition = (
  variant: Variants,
  customTransition?: { duration?: number; delay?: number },
): Variants => {
  if (!customTransition?.duration && !customTransition?.delay) {
    return variant;
  }

  const newVisibleTransition: Transition = {
    ...(typeof variant.visible === "object" && variant.visible?.transition
      ? variant.visible.transition
      : {}),
    ...(customTransition.duration !== undefined && {
      duration: customTransition.duration,
    }),
    ...(customTransition.delay !== undefined && {
      delay: customTransition.delay,
    }),
  };

  return {
    ...variant,
    visible: {
      ...(typeof variant.visible === "object" ? variant.visible : {}),
      transition: newVisibleTransition,
    },
  };
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: smoothEase },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.85, ease: smoothEase },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.85, ease: smoothEase },
  },
};

export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.95, ease: smoothEase },
  },
};

export const slideFromBottom: Variants = {
  hidden: { opacity: 0, y: 60, rotateX: -10 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 1.0, ease: [0.34, 0, 0.25, 1] as const },
  },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.95, ease: smoothEase },
  },
};

export const slideFromTop: Variants = {
  hidden: { opacity: 0, y: -60, rotateX: 10 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 1.0, ease: [0.34, 0, 0.25, 1] as const },
  },
};

// Character animation variants for split text
export const charFlyInTop: Variants = {
  hidden: { opacity: 0, y: -30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.75, ease: smoothEase },
  },
};

export const charFlyInBottom: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.75, ease: [0.34, 0, 0.25, 1] as const },
  },
};

export const charFadeInStagger: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.42, 0, 0.58, 0] as const },
  },
};

// Word animation variants (for word-level splits)
export const wordFlyInTop: Variants = {
  hidden: { opacity: 0, y: -25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: smoothEase },
  },
};

// Line animation variants (for line-by-line reveal from bottom)
export const lineRevealContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

export const lineRevealItem: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: { duration: 0.85, ease: smoothEase },
  },
};

// Staggered children variants for group animations
export const staggerChildren: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
      duration: 0.8,
      ease: smoothEase,
    },
  },
};

// Variants for animating child elements in a group
export const childFadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: smoothEase },
  },
};

// Smooth fade with subtle scale
export const smoothFade: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.85, ease: smoothEase },
  },
};

// For text with inline elements like <span>
export const textWithHighlight: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: smoothEase },
  },
};

export const flyDownFromTop: Variants = {
  hidden: { opacity: 0, y: -45, scale: 0.85 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: smoothEase },
  },
};
