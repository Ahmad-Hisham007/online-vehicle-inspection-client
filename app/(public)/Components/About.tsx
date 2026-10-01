import React from "react";
import LogoCarousel from "./logoCarousel";
import { EmblaOptionsType } from "embla-carousel";
import { TbSteeringWheel } from "react-icons/tb";
import { GiCarWheel } from "react-icons/gi";
import Image from "next/image";
import { Check, Checkmark } from "@hugeicons/core-free-icons";
import { IoCheckmark, IoCheckmarkDoneCircleSharp } from "react-icons/io5";

import { RiArrowRightLongLine } from "react-icons/ri";
import { Button } from "@/app/components/Button";
import Link from "next/link";

const Slides = [
  "/veyo.png",
  "/uber.png",
  "/turo.png",
  "/lyft.png",
  "/hopskipdrive.png",
  "/zum.png",
  "/getaround.png",
  "/everdriven.png",
  "/carepool.png",
];
const OPTIONS: EmblaOptionsType = {
  dragFree: true,
  loop: true,
};
const About = () => {
  return (
    <section className="bg-muted md:pt-20 pt-15 pb-10 md:pb-0 text-center">
      <div className="inline-flex items-center gap-3 mb-6">
        <GiCarWheel className="animate-bounce text-red-600 text-xl duration-[20s]" />
        <span className="text-sm font-semibold text-red-700 tracking-wide">
          Inspected With Top Certification Companies
        </span>
      </div>

      <LogoCarousel slides={Slides} options={OPTIONS} />
      <div className=" md:w-125 w-full mx-auto h-0.5 bg-destructive relative">
        <div className="md:w-90 w-7/12 z-999 h-full bg-[linear-gradient(90deg,#02010100_0%,#f4f2f2_80%)] right-0 absolute top-0"></div>
        <div className="md:w-90 w-7/12 z-999 h-full bg-[linear-gradient(270deg,#02010100_0%,#f4f2f2_80%)] left-0 absolute top-0"></div>
      </div>
      <div
        className="md:py-26 py-10 px-5 before:bg-cover before:bg-center before:bg-overlay before:bg-[url('/Layer-3-1.png')] before:content-[''] before:w-full before:h-full relative before:absolute before:top-0 before:left-0 z-10 before:opacity-20"
        // style={{ backgroundImage: "url('/Layer-3-1.png')" }}
      >
        <div className="max-w-7xl relative mx-auto z-20">
          <h2 className="max-w-3xl mx-auto text-stone-900 capitalize leading-tight font-medium md:text-5xl text-3xl tracking-tight">
            Stop wasting time. Get your car-inspection done online in{" "}
            <span className="text-red-600 underline decoration-red-200 underline-offset-4">
              minutes
            </span>
          </h2>
          <div className="grid md:grid-cols-2 grid-cols-1 md:gap-15 gap-5 md:pt-15 pt-10">
            <div>
              <Image
                src="/detailing-film-specialist-cutting-and-wrapping-car-at-auto-repair-shop.jpg"
                alt="car inspection"
                width={900}
                height={700}
                className=" w-full rounded-3xl"
              />
            </div>
            <div className="text-left">
              <p className="text-left text-[16px]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip.
              </p>
              <div className="flex gap-4 items-start mt-6">
                <IoCheckmarkDoneCircleSharp className="text-destructive/60 w-8 h-8 grow-0 shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="md:text-2xl text-xl font-semibold text-stone-800 mb-3">
                    Expert Inspectors
                  </h3>
                  <p className="text-justify">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start mt-5">
                <IoCheckmarkDoneCircleSharp className="text-destructive/60 w-8 h-8 grow-0 shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="md:text-2xl text-xl font-semibold text-stone-800 mb-3">
                    24/7 Active Support
                  </h3>
                  <p className="text-justify">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod tempor incididunt ut
                  </p>
                </div>
              </div>
              <Link
                href={"http://localhost:3000/dashboard/customer/inspection"}
              >
                <Button
                  variant={"secondary"}
                  className="gap-3 mt-7 px-6 py-3 md:text-lg text-sm upppercase rounded-full leading-none min-h-[unset] h-[unset] w-[unset]"
                >
                  Start Now
                  <RiArrowRightLongLine className="w-6! h-6! text-3xl!" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
