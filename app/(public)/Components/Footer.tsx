import React from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { FiFacebook } from "react-icons/fi";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-[#0B0F17] text-stone-300 font-sans border-t border-stone-800/80">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-12">
          {/* Column 1: Brand & Description */}
          <div className="md:col-span-5 space-y-4">
            <Link
              href="/"
              aria-label="Go to homepage"
              className="cursor-pointer"
            >
              <h1 className="text-3xl font-black tracking-tight text-gray-900">
                <Image
                  src="/Online_Vehicle_Inspection_Logo_No_BG.png"
                  width={100}
                  height={70}
                  alt="Website Logo"
                  className="object-contain object-left mb-5 -ml-4"
                  style={{ width: "auto", height: "auto", maxHeight: "50px" }}
                />
              </h1>
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed max-w-sm font-normal">
              We are the best way to pass the vehicle inspection required for
              Uber, Lyft, Turo, and other ride-sharing and car-sharing
              platforms. Save your time and money — get your certificate in
              minutes.
            </p>
          </div>

          {/* Column 2: Contact Info */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase">
              Contact Us
            </h3>
            <div className="space-y-2 text-sm font-normal">
              <div>
                <Link
                  href="mailto:support@insve.com"
                  className="text-stone-300 hover:text-white underline underline-offset-4 decoration-stone-600 transition-colors"
                >
                  support@insve.com
                </Link>
              </div>
              <div>
                <Link
                  href="tel:808-800-9292"
                  className="text-stone-300 hover:text-white underline underline-offset-4 decoration-stone-600 transition-colors"
                >
                  808-800-9292
                </Link>
              </div>
              <p className="text-stone-400 text-xs pt-1">ARD315746</p>
            </div>
          </div>

          {/* Column 3: Social Icons */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase">
              Follow Us
            </h3>
            <div className="flex items-center gap-3">
              <Link
                href="https://t.me/onlinevehicleinspection"
                aria-label="Telegram"
                className="w-10 h-10 rounded-lg bg-primary border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:bg-stone-800 hover:border-stone-700 transition-all"
              >
                <Send className="w-6 h-6" />
              </Link>
              <Link
                href="https://www.instagram.com/onlinevehicleinspection?igsh=ejJoYmw1dmEwMXZw"
                aria-label="Instagram"
                className="w-10 h-10 rounded-lg bg-primary border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:bg-stone-800 hover:border-stone-700 transition-all"
              >
                <FaInstagram className="w-6 h-6" />
              </Link>
              <Link
                href="https://www.facebook.com/groups/insve"
                aria-label="Facebook"
                className="w-10 h-10 rounded-lg bg-primary border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:bg-stone-800 hover:border-stone-700 transition-all"
              >
                <FiFacebook className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-stone-800/80 pt-8 text-center">
          <p className="text-xs text-stone-500 font-medium tracking-wider uppercase">
            INSVE.COM © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
