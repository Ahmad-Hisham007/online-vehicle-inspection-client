import React from "react";
import { Shield, Diamond, Target, Heart } from "lucide-react";

const WhyChooseUs = () => {
  const features = [
    {
      icon: <Shield className="w-5 h-5 text-white" />,
      title: "Trained Professionals",
      description:
        "Skilled detailing experts delivering precision automotive care and flawless finishes.",
    },
    {
      icon: <Diamond className="w-5 h-5 text-white" />,
      title: "High-Quality Products",
      description:
        "Using trusted premium products for lasting vehicle protection and exceptional shine results.",
    },
    {
      icon: <Target className="w-5 h-5 text-white" />,
      title: "Advanced Techniques",
      description:
        "Modern detailing methods designed for superior cleaning and surface enhancement.",
    },
    {
      icon: <Heart className="w-5 h-5 text-white" />,
      title: "Customer Satisfaction",
      description:
        "Committed to exceptional service, quality results, and premium, professional vehicle care.",
    },
  ];

  return (
    <section className="bg-[#f4f5f7] py-20 px-6 md:px-12 lg:px-20 min-h-screen flex items-center justify-center font-sans">
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Heading Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#A82B33] inline-block"></span>
            <span className="text-xs font-medium text-gray-600 tracking-wide">
              Why Choose Us
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-[54px] font-light text-[#111827] leading-[1.15] tracking-tight">
            Excellence in <br />
            <span className="text-[#8B93A1] font-normal">Every Detail</span>
          </h2>
        </div>

        {/* Right Feature Cards Grid Column */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100/80 flex flex-col justify-between min-h-[260px] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] transition-shadow duration-300"
            >
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
