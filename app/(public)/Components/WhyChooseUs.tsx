import React from "react";
import {
  Shield,
  Diamond,
  Target,
  Heart,
  ShieldCheck,
  FastForward,
  BanknoteCheck,
  WandSparkles,
  BadgePercent,
  MapPin,
} from "lucide-react";
import { GiCarWheel } from "react-icons/gi";
import { AnimateOnScroll, AutoLineSplitter } from "./AnimateOnScroll";
import { charFlyInTop, scaleIn } from "./animations";

const WhyChooseUs = () => {
  const features = [
    {
      icon: <MapPin className="w-5 h-5 text-white" />,
      title: "Access Anywhere",
      description:
        "No appointment is needed. Do it in any convenient place at any time you want.",
    },
    {
      icon: <BadgePercent className="w-5 h-5 text-white" />,
      title: "Affordable prices",
      description:
        "The lowest prices on the market. Twice cheaper than your car service charges.",
    },
    {
      icon: <WandSparkles className="w-5 h-5 text-white" />,
      title: "Ridiculously simple",
      description: "Avoid wasting hours on car services",
    },
    {
      icon: <BanknoteCheck className="w-5 h-5 text-white" />,
      title: "Compliance",
      description:
        "Just upload your vehicle inspection certificates to the app.",
    },
    {
      icon: <FastForward className="w-5 h-5 text-white" />,
      title: "Easy process",
      description:
        "All you need is a smartphone with a camera and internet access.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-white" />,
      title: "Transparency",
      description:
        "Get your rideshare vehicle inspection certificates that are fully legal and approved.",
    },
  ];

  return (
    <section className="bg-[#f4f5f7] py-20 px-6 md:px-12 lg:px-20 min-h-screen flex items-center justify-center font-sans">
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Heading Column */}

        <div className="lg:col-span-3">
          <div className="space-y-4 mt-7 sticky">
            <div className="inline-flex items-center gap-3">
              <GiCarWheel className="animate-bounce text-red-600 text-xl duration-[20s]" />
              <span className="text-sm font-semibold text-red-700 tracking-wide">
                <AutoLineSplitter text="Why Choose Us" />
              </span>
            </div>

            <h2 className="font-semibold text-3xl md:text-5xl text-stone-900 leading-tight tracking-tight">
              <AutoLineSplitter text="Excellence in" />

              <span className="text-red-600 [&_span]:underline [&_span]:decoration-red-200 [&_span]:underline-offset-4">
                <AutoLineSplitter text="Every Detail" />
              </span>
            </h2>
          </div>
        </div>

        {/* Right Feature Cards Grid Column */}
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <AnimateOnScroll key={index} delay={index * 0.2} variants={scaleIn}>
              <div className="bg-white rounded-xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100/80 flex flex-col justify-between min-h-[260px] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-shadow duration-300">
                <div>
                  {/* Icon Circle */}
                  <div className="w-10 h-10 rounded-lg bg-[#A82B33] flex items-center justify-center mb-6 shadow-sm">
                    {feature.icon}
                  </div>

                  {/* Card Title */}
                  <h3 className="text-xl font-normal text-[#18181B] leading-snug tracking-tight mb-3">
                    {feature.title.split(" ").map((word, i) => (
                      <React.Fragment key={i}>
                        {word} {i === 0 && <br />}
                      </React.Fragment>
                    ))}
                  </h3>
                </div>

                {/* Card Description */}
                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                  {feature.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
