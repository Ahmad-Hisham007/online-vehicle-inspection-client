import React from "react";
import Link from "next/link";
import Image from "next/image";
import { RiArrowRightLongLine } from "react-icons/ri";
import { Button } from "@/components/ui/button"; // ba apnar custom Button component path

const CtaSection = () => {
  return (
    <section className="relative w-full min-h-125 md:min-h-150 flex items-center md:items-start overflow-hidden">
      {/* Background Image with subtle overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/car-detailing-concept.jpg"
          alt="Car Detailing Concept"
          fill
          priority
          className="object-cover object-center brightness-90"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Floating Dark Content Card */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-6 md:pb-12 flex justify-center md:justify-end">
        <div className="bg-black/90 backdrop-blur-md text-white rounded-b-3xl rounded-t-3xl sm:rounded-t-none p-8 sm:p-12 md:p-14 max-w-2xl w-full shadow-2xl border border-white/10 space-y-6 text-left">
          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-[1.15]">
            Contact Us Today And Experience Certified Vehicle Insection at only
            $29.
          </h2>

          {/* Subtitle Paragraph */}
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-light">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit
            tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.
          </p>

          {/* CTA Button Link */}
          <div className="pt-2 w-full">
            <Link href="/dashboard/customer/inspection">
              <Button className="gap-3 px-8 py-3.5 h-auto text-base uppercase rounded-full tracking-wider bg-primary text-white hover:bg-primary/80 transition-all duration-300 shadow-lg border-none">
                Start Now
                <RiArrowRightLongLine className="w-5 h-5 text-xl" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
