import { Button } from "@/app/components/Button";
import Image from "next/image";
import React from "react";
import { GiCarWheel } from "react-icons/gi";
import { RiArrowRightLongLine } from "react-icons/ri";
import {
  IoMdArrowBack,
  IoMdArrowForward,
  IoMdArrowDown,
  IoMdCheckmarkCircleOutline,
} from "react-icons/io";
import Link from "next/link";
import { AnimateOnScroll } from "./AnimateOnScroll";
import {
  flyDownFromTop,
  slideFromBottom,
  slideFromLeft,
  slideFromRight,
} from "./animations";

const HowItWorks = () => {
  const steps = [
    {
      src: "/HIW1.jpg",
      title: "01",
      alt: "Redi Share Inspection Process Step 1",
    },
    {
      src: "/HIW2.jpg",
      title: "02",
      alt: "Redi Share Inspection Process Step 2",
    },
    {
      src: "/HIW3.jpg",
      title: "03",
      alt: "Redi Share Inspection Process Step 3",
    },
    {
      src: "/HIW4.png",
      title: "04",
      alt: "Redi Share Inspection Process Step 4",
    },
  ];

  const inspections = [
    "Uber Inspection",
    "LYFT INSPECTION",
    "TURO INSPECTION",
    "VEYO INSPECTION",
  ];
  return (
    <section className="md:py-20 py-15 bg-gradient-to-b from-stone-100 via-white to-stone-50/30 overflow-hidden font-sans">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Top Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:mb-16 mb-6">
          {/* Left Column: Heading & Subtitle */}
          <AnimateOnScroll
            variants={slideFromLeft}
            duration={1.0}
            className="lg:col-span-6"
          >
            <div className=" space-y-4">
              <div className="inline-flex items-center gap-3">
                <GiCarWheel className="animate-bounce text-red-600 text-xl duration-[20s]" />
                <span className="text-sm font-semibold text-red-700 tracking-wide">
                  Fast, easy, and risk-free.
                </span>
              </div>

              <h2 className="font-semibold text-3xl md:text-4xl text-stone-900 leading-tight tracking-tight">
                Complete your vehicle inspection online in minutes with your{" "}
                <span className="text-red-600 underline decoration-red-200 underline-offset-4">
                  smartphone
                </span>
                .
              </h2>
            </div>
          </AnimateOnScroll>

          {/* Right Column: Description, Features & CTA */}
          <AnimateOnScroll
            variants={slideFromRight}
            className="lg:col-[8/span_5]"
          >
            <div className="lg:text-right space-y-8 flex flex-col items-end">
              {/* Checkmark Features Pills */}
              <div className="flex flex-wrap lg:justify-end gap-3 pt-2 [&>div]:flex-[1_1_40%]">
                {inspections.map((text, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white border border-stone-200/80 px-3 py-1.5 rounded-lg shadow-2xs hover:border-red-300 transition-colors"
                  >
                    <IoMdCheckmarkCircleOutline className="text-red-600 text-base" />
                    <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="pt-2 w-full">
                <Link href="/dashboard/customer/inspection">
                  <Button className="gap-3 px-8 py-3.5 text-base uppercase rounded-full tracking-wider">
                    Start Now
                    <RiArrowRightLongLine className="w-5 h-5 text-xl" />
                  </Button>
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
        <div className=" md:w-250 w-full mx-auto h-0.5 bg-destructive relative md:mb-16 mb-6">
          <div className="md:w-90 w-7/12 z-999 h-full bg-[linear-gradient(90deg,#02010100_0%,#f4f2f2_80%)] right-0 absolute top-0"></div>
          <div className="md:w-90 w-7/12 z-999 h-full bg-[linear-gradient(270deg,#02010100_0%,#f4f2f2_80%)] left-0 absolute top-0"></div>
        </div>
        {/* Process Flow Cards (Snake Flow Layout) */}
        <div className="space-y-6">
          {/* Row 1: Steps 1 & 2 */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Step 1 */}
            <AnimateOnScroll
              variants={slideFromBottom}
              className="md:col-span-5 "
            >
              <div className="md:col-span-5 relative group bg-white p-3 rounded-2xl border border-stone-200/70 shadow-md hover:shadow-xl hover:border-red-200 transition-all duration-300">
                <span className="absolute top-5 left-5 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Step {steps[0].title}
                </span>
                <div className="relative h-72 md:h-110 w-full overflow-hidden rounded-xl aspect-square">
                  <Image
                    src={steps[0].src}
                    fill
                    alt={steps[0].alt}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </AnimateOnScroll>

            {/* Connector Arrow 1 */}
            <div className="md:col-span-1 flex justify-center py-2 md:py-0">
              <div className="w-12 h-12 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-red-700 animate-bounce md:animate-caret-blink">
                <IoMdArrowForward className="w-6 h-6 hidden md:block" />
                <IoMdArrowDown className="w-6 h-6 md:hidden" />
              </div>
            </div>

            {/* Step 2 */}
            <AnimateOnScroll
              variants={slideFromBottom}
              className="md:col-span-5 "
            >
              <div className="relative group bg-white p-3 rounded-2xl border border-stone-200/70 shadow-md hover:shadow-xl hover:border-red-200 transition-all duration-300">
                <span className="absolute top-5 left-5 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Step {steps[1].title}
                </span>
                <div className="relative h-72 md:h-110 w-full overflow-hidden rounded-xl aspect-square">
                  <Image
                    src={steps[1].src}
                    fill
                    alt={steps[1].alt}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Row Connector Down Arrow */}
          <div className="flex md:justify-end justify-center pr-0 md:pr-[22.5%] my-2">
            <div className="w-12 h-12 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-red-700 animate-bounce">
              <IoMdArrowDown className="w-6 h-6" />
            </div>
          </div>

          {/* Row 2: Steps 3 & 4 (Reversed Arrow Sequence) */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Step 3 */}
            <AnimateOnScroll
              variants={slideFromBottom}
              className="md:col-span-5 order-1 md:order-3"
            >
              <div className="relative group bg-white p-3 rounded-2xl border border-stone-200/70 shadow-md hover:shadow-xl hover:border-red-200 transition-all duration-300">
                <span className="absolute top-5 left-5 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Step {steps[2].title}
                </span>

                <div className="relative h-72 md:h-110 w-full overflow-hidden rounded-xl aspect-square">
                  <Image
                    src={steps[2].src}
                    fill
                    alt={steps[2].alt}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </AnimateOnScroll>

            {/* Connector Arrow 2 */}
            <div className="md:col-span-1 flex justify-center py-2 md:py-0 order-2 md:order-2">
              <div className="w-12 h-12 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-red-700 animate-bounce md:animate-caret-blink">
                <IoMdArrowBack className="w-6 h-6 hidden md:block" />
                <IoMdArrowDown className="w-6 h-6 md:hidden" />
              </div>
            </div>

            {/* Step 4 */}
            <AnimateOnScroll
              variants={slideFromBottom}
              className="md:col-span-5 order-3 md:order-1"
            >
              <div className="relative group bg-white p-3 rounded-2xl border border-stone-200/70 shadow-md hover:shadow-xl hover:border-red-200 transition-all duration-300 order-3 md:order-1">
                <span className="absolute top-5 left-5 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Step {steps[3].title}
                </span>
                <div className="relative h-72 md:h-110 w-full overflow-hidden rounded-xl aspect-square">
                  <Image
                    src={steps[3].src}
                    fill
                    alt={steps[3].alt}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
