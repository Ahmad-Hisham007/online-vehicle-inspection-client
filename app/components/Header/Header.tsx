"use client";

import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import Image from "next/image"; // Next.js Image component import kora holo
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
const Header = () => {
  const [selectedLang, setSelectedLang] = useState("En");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoutMenuItems, setLogOutMenuItems] = useState([]);
  const languages = [
    { code: "En", flag: "/us.png" },
    { code: "Es", flag: "/es.png" },
    { code: "Ch", flag: "/cn.png" },
  ];

  const currentLang =
    languages.find((l) => l.code === selectedLang) || languages[0];

  const logOutMenuQuery = `query GetAllMenus {
  menu(id: "4", idType: DATABASE_ID) {
    menuItems {
      nodes {
        cssClasses
        label
        path
      }
    }
  }
}`;

  //   useEffect(() => {
  //     const fetchLogoutMenu = async () => {
  //       try {
  //         const res = fetch(process.env.WORDPRESS_GRAPHQL_URL!, {
  //             query:,
  //             variable:
  //         });
  //       } catch (error) {}
  //     };
  //     fetchLogoutMenu();
  //   }, []);

  return (
    <header className="w-full bg-white shadow-sm relative z-50">
      <div className="max-w-290 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* --- Left Section: Shadcn Language Dropdown with Next.js Image --- */}
          <div className="flex-1 flex justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-md transition-colors outline-none focus:ring-2 focus:ring-gray-200">
                <div className="w-6 h-4 relative rounded-sm overflow-hidden border border-gray-100 flex items-center">
                  <Image
                    src={currentLang.flag}
                    alt={`${currentLang.code} flag`}
                    width={24}
                    height={16}
                    className="object-cover"
                  />
                </div>
                <span className="font-medium text-gray-700 text-base">
                  {currentLang.code}
                </span>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-32 bg-white">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="w-6 h-4 relative rounded-sm overflow-hidden border border-gray-100 flex items-center">
                      <Image
                        src={lang.flag}
                        alt={`${lang.code} flag`}
                        width={24}
                        height={16}
                        className="object-cover"
                      />
                    </div>
                    <span className="text-gray-700 font-medium">
                      {lang.code}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* --- Center Section: Logo --- */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-3xl font-black tracking-tight text-gray-900 cursor-pointer">
              <Image
                src="/Online_Vehicle_Inspection_Logo_No_BG.png"
                width="140"
                height="70"
                alt="Website Logo"
                className="object-cover"
              ></Image>
            </h1>
          </div>

          {/* --- Right Section: Hamburger Menu --- */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-50 rounded-md transition-colors"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? (
                <FiX className="w-7 h-7 text-gray-800" />
              ) : (
                <FiMenu className="w-7 h-7 text-gray-800" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Menu modal  */}
      <div
        className={`absolute top-full left-0 w-full grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isMenuOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <Card className="rounded-none border-y border-gray-200 bg-gray-50">
            <div className="max-w-290 mx-auto px-4 sm:px-6 lg:px-8">
              {/* Single line elements container */}
              <div className="flex justify-end items-center gap-8 text-sm font-medium text-gray-700">
                <a
                  href="#"
                  className="flex items-center gap-2 hover:text-black transition-colors"
                >
                  Sign In
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 hover:text-black transition-colors"
                >
                  Contact Us
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 hover:text-black transition-colors"
                >
                  Blog
                </a>

                {/* Brand Logos (Placeholder) */}
                <div className="flex items-center gap-6 ml-4 border-l pl-6 border-gray-200">
                  <span className="font-bold text-lg text-black">Uber</span>
                  <span className="font-bold text-lg text-pink-600">lyft</span>
                  <span className="font-bold text-sm bg-black text-white px-2 py-1 rounded">
                    TURO
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </header>
  );
};

export default Header;
