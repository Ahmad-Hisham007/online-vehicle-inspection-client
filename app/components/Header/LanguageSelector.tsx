"use client";

import { useState } from "react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: "En", flag: "/us.png" },
  { code: "Es", flag: "/es.png" },
  { code: "Ch", flag: "/cn.png" },
];

export default function LanguageSelector() {
  const [selectedLang, setSelectedLang] = useState("En");

  const currentLang =
    LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

  return (
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
        {LANGUAGES.map((lang) => (
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
            <span className="text-gray-700 font-medium">{lang.code}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
