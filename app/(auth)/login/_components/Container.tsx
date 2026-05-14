"use client";
import { FaGoogle } from "react-icons/fa";
import LoginForm from "./LoginForm";
import { useState, useEffect, useRef } from "react";
import SignupForm from "./SignupForm";
import { signIn } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/app/components/Button";

const Container = () => {
  const [isLoginCol, setIsLoginCol] = useState<boolean>(true);
  const formRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.innerWidth < 1024 && formRef.current) {
      const visibleDiv = formRef.current.querySelector(
        isLoginCol ? ".login" : ".signup",
      );

      if (visibleDiv) {
        formRef.current.style.minHeight = `${visibleDiv.scrollHeight}px`;
      }
    } else if (formRef.current) {
      formRef.current.style.minHeight = "auto";
    }
  }, [isLoginCol]);
  const handleSocialLogin = (provider: string) => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };
  return (
    <Card
      className={`max-w-6xl p-0 gap-0 perspective-[1000px] mx-auto grow flex flex-col-reverse lg:flex-row items-stretch rounded-lg card h-auto md:overflow-hidden overflow-visible lg:min-h-150 relative ${isLoginCol ? "" : "!lg:mt-0"}`}
    >
      {/* 1. Form Container */}
      <div
        ref={formRef}
        className={`w-full lg:basis-1/2 grid transition-transform duration-700 
      ${isLoginCol ? "" : "lg:translate-x-full lg:translate-y-0"} 
      z-30 relative`}
      >
        <div
          className={`login py-16 absolute md:static w-full lg:px-20 flex flex-col justify-center transition-all duration-700 self-center md:self-auto 
        ${isLoginCol ? "opacity-100 z-20 blur-0 transform-[rotateY(0deg)_scale(1)]" : "opacity-0 z-10 blur-md pointer-events-none transform-[rotateY(180deg)_scale(0.8)]"} px-4 backface-hidden`}
          style={{
            gridArea: "1/1",
            backgroundImage: "url('/light-bg.jpg')",
            backgroundSize: "cover",
          }}
        >
          <h2 className="text-3xl font-bold text-center pb-5">
            Sign in to your account
          </h2>
          <div className="h-0.5 bg-linear-to-br from-primary to-secondary mb-5 w-18 mx-auto" />
          <LoginForm />
          <div className="flex items-center justify-center gap-2">
            <span className="h-px bg-gray-300 w-full grow shrink"></span>
            <div className="divider my-7 text-sm font-bold text-gray-400 uppercase">
              OR
            </div>
            <span className="h-px bg-gray-300 w-full grow shrink"></span>
          </div>
          <div className="flex gap-2 [&_button]:cursor-pointer">
            <Button
              onClick={() => handleSocialLogin("google")}
              variant={"secondary"}
              size={"icon"}
            >
              <div>Sign-in with Google</div> <FaGoogle />
            </Button>
          </div>
        </div>

        <div
          className={`signup w-full py-16 absolute md:static lg:px-20 flex flex-col items-center justify-center transition-all duration-700 self-center md:self-auto
        ${!isLoginCol ? "opacity-100 z-20 blur-0 transform-[rotateY(0deg)_scale(1)]" : "opacity-0 z-10 blur-md pointer-events-none transform-[rotateY(-180deg)_scale(0.8)]"} backface-hidden px-4`}
          style={{
            gridArea: "1/1",
            backgroundImage: "url('/light-bg.jpg')",
            backgroundSize: "cover",
          }}
        >
          <h2 className="text-3xl font-bold text-center pb-5">
            Create a new account
          </h2>
          <div className="h-0.5 bg-linear-to-br from-primary to-secondary mb-5 w-18" />
          <SignupForm />
        </div>
      </div>

      {/* 2. Banner Container */}
      <div
        ref={bannerRef}
        className={`w-full relative lg:basis-1/2 flex flex-col items-center justify-center gap-5 text-center min-h-100 lg:h-auto py-10 px-4 transition-transform duration-700 
      ${isLoginCol ? "" : "lg:-translate-x-full lg:translate-y-0"} 
      z-50`}
        style={{
          backgroundImage:
            'url("/car-headlight-buildings-reflecting-headlight-car.jpg")',
          backgroundSize: "cover",
        }}
      >
        <div className="absolute w-full h-full bg-black/50 border-full top-half left-0 z-1 "></div>

        <div className="z-10 flex flex-col items-center justify-center gap-5 text-center">
          <h2 className="text-3xl text-white font-bold">
            {isLoginCol ? "Sign up" : "Sign In"}
          </h2>
          {isLoginCol ? (
            <p className="text-white text-lg px-5 lg:max-w-[80%] mx-auto">
              Don&apos;t have an account? Please, create a new one
            </p>
          ) : (
            <p className="text-white text-lg px-5 lg:max-w-[80%] mx-auto">
              Do you have an existing account? Please, Sign In
            </p>
          )}

          <Button
            className="w-auto!"
            onClick={() => setIsLoginCol(!isLoginCol)}
          >
            {isLoginCol ? "Sign up" : "Sign In"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Container;
