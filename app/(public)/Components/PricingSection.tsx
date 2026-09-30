import React from "react";
import { Check } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      name: "Basic Wash",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      price: "49",
      period: "/ Service",
      bgColor: "bg-white",
      textColor: "text-[#1C1917]",
      subTextColor: "text-[#78716C]",
      priceTagBg: "bg-[#F5F5F4]",
      priceTextColor: "text-[#C2410C]",
      pricePeriodColor: "text-[#A8A29E]",
      checkColor: "text-[#F97316]",
      featureTextColor: "text-[#57534E]",
      btnBg: "bg-[#FF5700] hover:bg-[#E64E00] text-white",
      features: [
        "Premium Car Wash",
        "High-Speed Internet Access",
        "Access to Shared Rooms",
        "Moneyback Guarantee",
        "Full Service",
      ],
    },
    {
      name: "Full Detailing",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      price: "149",
      period: "/ Service",
      bgColor: "bg-[#C2410C]",
      textColor: "text-white",
      subTextColor: "text-orange-100/80",
      priceTagBg: "bg-[#F5F5F4]",
      priceTextColor: "text-[#C2410C]",
      pricePeriodColor: "text-[#78716C]",
      checkColor: "text-white",
      featureTextColor: "text-white/90",
      btnBg: "bg-white hover:bg-orange-50 text-[#1C1917]",
      features: [
        "Premium Detailing",
        "High-Speed Internet",
        "Dedicated Waiting Rooms",
        "Moneyback Guarantee",
        "Common Areas",
      ],
    },
    {
      name: "Premium Care",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      price: "299",
      period: "/ Month",
      bgColor: "bg-[#1C0F08]",
      textColor: "text-white",
      subTextColor: "text-stone-400",
      priceTagBg: "bg-[#F5F5F4]",
      priceTextColor: "text-[#C2410C]",
      pricePeriodColor: "text-[#78716C]",
      checkColor: "text-white",
      featureTextColor: "text-stone-300",
      btnBg: "bg-white hover:bg-stone-100 text-[#1C1917]",
      features: [
        "Dedicated Care Services",
        "High-Speed Internet",
        "Full Detailing",
        "Free 10X Monthly",
        "Premium Lounge",
      ],
    },
  ];

  return (
    <section className="relative bg-[#F7F5F0] py-24 px-6 overflow-hidden min-h-screen flex items-center justify-center font-sans">
      {/* Background Decorative Wavy Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 800"
        fill="none"
      >
        <path
          d="M-100,500 C300,200 600,700 1000,300 C1200,100 1500,400 1600,200"
          stroke="#E7E5E4"
          strokeWidth="1.5"
        />
        <path
          d="M-100,300 C400,600 700,100 1100,500 C1300,700 1500,200 1600,300"
          stroke="#E7E5E4"
          strokeWidth="1.5"
        />
      </svg>

      <div className="relative max-w-6xl mx-auto w-full">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#F2EFE9] px-3 py-1 rounded-full text-xs font-medium text-[#78716C]">
            <span className="w-2 h-2 rounded-full bg-[#FB923C]"></span>
            Pricing & Package
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-[#1C1917] tracking-tight leading-tight">
            Lets Discover Our Affordable & <br className="hidden sm:inline" />
            Transparent Pricing.
          </h2>
        </div>

        {/* Pricing Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-[28px] p-8 shadow-sm flex flex-col justify-between ${plan.bgColor} transition-transform duration-300 hover:-translate-y-1`}
            >
              <div>
                {/* Header Info */}
                <h3 className={`text-2xl font-bold mb-2 ${plan.textColor}`}>
                  {plan.name}
                </h3>
                <p
                  className={`text-sm leading-relaxed mb-8 ${plan.subTextColor}`}
                >
                  {plan.description}
                </p>

                {/* Price Tag Badge */}
                <div
                  className={`inline-flex items-baseline gap-1.5 px-6 py-3 rounded-r-2xl rounded-l-full ${plan.priceTagBg} mb-8 -ml-8`}
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
              </div>

              {/* Action Button */}
              <button
                className={`w-full py-4 rounded-full text-sm font-semibold tracking-wide transition-colors duration-200 shadow-sm ${plan.btnBg}`}
              >
                Get A Quote
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
