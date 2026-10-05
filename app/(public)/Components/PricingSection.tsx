import React from "react";
import { Check } from "lucide-react";
import { GiCarWheel } from "react-icons/gi";
import Image from "next/image";
import Link from "next/link";
import { AnimateOnScroll, AutoLineSplitter } from "./AnimateOnScroll";
import { slideFromBottom, slideFromTop } from "./animations";

const PricingSection = () => {
  const plans = [
    {
      image: "/uber.png",
      name: "Uber Inspection",
      price: "24",
      period: "/ Year",
      bgColor: "bg-white",
      textColor: "text-[#1C1917]",
      subTextColor: "text-[#78716C]",
      priceTagBg: "bg-[#F7F5F0]",
      priceTextColor: "text-destructive",
      pricePeriodColor: "text-[#A8A29E]",
      checkColor: "text-primary",
      featureTextColor: "text-[#57534E]",
      btnBg: "bg-primary hover:bg-red-900 text-white",
      mt: "md:mt-55 mt-0",
      features: [
        "Full Inspection",
        "All In Data",
        "Location varieties",
        "Moneyback Guarantee",
        "24/7 Support",
      ],
    },
    {
      image: "/lyft.png",
      name: "Lyft Inspection",
      price: "24",
      period: "/ Year",
      bgColor: "bg-white",
      textColor: "text-[#1C1917]",
      subTextColor: "text-[#78716C]",
      priceTagBg: "bg-[#F7F5F0]",
      priceTextColor: "text-destructive",
      pricePeriodColor: "text-[#A8A29E]",
      checkColor: "text-primary",
      featureTextColor: "text-[#57534E]",
      btnBg: "bg-primary hover:bg-red-900 text-white",
      mt: "md:mt-35 mt-0",
      features: [
        "Full Inspection",
        "All In Data",
        "Location varieties",
        "Moneyback Guarantee",
        "24/7 Support",
      ],
    },
    {
      image: "/turo.png",
      name: "Turo Inspection",
      price: "24",
      period: "/ Year",
      bgColor: "bg-white",
      textColor: "text-[#1C1917]",
      subTextColor: "text-[#78716C]",
      priceTagBg: "bg-[#F7F5F0]",
      priceTextColor: "text-destructive",
      pricePeriodColor: "text-[#A8A29E]",
      checkColor: "text-primary",
      featureTextColor: "text-[#57534E]",
      btnBg: "bg-primary hover:bg-red-900 text-white",
      mt: "md:mt-15 mt-0",
      features: [
        "Full Inspection",
        "All In Data",
        "Location varieties",
        "Moneyback Guarantee",
        "24/7 Support",
      ],
    },
    {
      image: "/uber.png",
      image2: "/lyft.png",
      name: "Uber Lyft Inspection",
      price: "39",
      period: "/ Year",
      bgColor: "bg-primary",
      textColor: "text-white",
      subTextColor: "text-white/60",
      priceTagBg: "bg-[#F7F5F0]",
      priceTextColor: "text-destructive",
      pricePeriodColor: "text-[#A8A29E]",
      checkColor: "text-white",
      featureTextColor: "text-white/70",
      btnBg: "bg-white hover:bg-red-900 hover:text-white text-primary",
      mt: "mt-0",
      features: [
        "Full Inspection",
        "All In Data",
        "Location varieties",
        "Moneyback Guarantee",
        "24/7 Support",
      ],
    },
  ];

  return (
    <section className="before:bg-cover before:bg-center before:bg-overlay before:bg-[url('/Layer-3-1.png')] before:content-[''] before:w-full before:h-full relative before:absolute before:top-0 before:left-0 z-10 before:opacity-20 bg-[#F7F5F0] md:py-24 py-15 md:px-6 px-4 overflow-hidden min-h-screen flex items-center justify-center font-sans">
      <div className="relative max-w-6xl mx-auto w-full ">
        {/* Header Section */}

        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-3">
            <GiCarWheel className="animate-bounce text-red-600 text-xl duration-[20s]" />
            <span className="text-sm font-semibold text-red-700 tracking-wide">
              <AutoLineSplitter text="Pricing & Package" />
            </span>
          </div>
          <h2 className="font-semibold text-3xl md:text-5xl text-stone-900 leading-tight tracking-tight">
            <AutoLineSplitter
              text="Lets Discover Our Affordable & Transparent Pricing."
              className="[&>span:last-child>span]:underline [&>span:last-child>span]:decoration-red-200 [&>span:last-child>span]:underline-offset-4 [&>span:last-child>span]:last:text-red-600"
            />
          </h2>
        </div>

        {/* Pricing Cards Container */}
        <div className="flex md:flex-row flex-col gap-8 [&>div]:flex-1 items-start">
          {plans.map((plan, index) => (
            <AnimateOnScroll
              key={index}
              className={`${plan.mt} w-full`}
              delay={index * 0.2}
              variants={slideFromBottom}
            >
              <div
                className={`rounded-[28px]  py-8 shadow-sm flex flex-col justify-between ${plan.bgColor} transition-transform duration-300 hover:-translate-y-1`}
              >
                <div className="px-8">
                  {/* Header Info */}
                  <div className="flex gap-2 items-center">
                    <Image
                      src={plan.image ?? ""}
                      width={80}
                      height={50}
                      alt="inspection logo"
                      className="max-w-full object-contain"
                    />
                    {plan.image2 && (
                      <>
                        <span className="text-gray-500 font-bold">+</span>
                        <Image
                          src={plan.image2}
                          width={80}
                          height={50}
                          className="max-w-full object-contain"
                          alt="secondary inspection logo"
                        />
                      </>
                    )}
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${plan.textColor}`}>
                    Inspection
                  </h3>
                  <p
                    className={`text-lg leading-relaxed mb-8 ${plan.subTextColor}`}
                  >
                    {plan.name}
                  </p>
                </div>
                {/* Price Tag Badge */}
                <div
                  className={`inline-flex w-full items-baseline gap-1.5 px-6 py-3 rounded-r-2xl rounded-l-full ${plan.priceTagBg} mb-8 ml-3`}
                >
                  <span
                    className={`text-3xl font-extrabold ${plan.priceTextColor}`}
                  >
                    ${plan.price}
                  </span>
                  <span
                    className={`text-xs font-medium ${plan.pricePeriodColor}`}
                  >
                    {plan.period}
                  </span>
                </div>
                <div className="px-8">
                  {/* Features List */}
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-3">
                        <Check
                          className={`w-4 h-4 stroke-[3] ${plan.checkColor}`}
                        />
                        <span
                          className={`text-sm font-medium ${plan.featureTextColor}`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <Link
                    href="/dashboard/customer/inspection"
                    className={`w-full py-4 block text-center rounded-full text-sm font-semibold tracking-wide transition-colors duration-200 shadow-sm ${plan.btnBg}`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
