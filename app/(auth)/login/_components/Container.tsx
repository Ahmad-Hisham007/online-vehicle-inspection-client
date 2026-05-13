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
  const [bannerH, setBannerH] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [heightDiff, setHeightDiff] = useState(0);

  useEffect(() => {
    const calculateHeights = () => {
      if (formRef.current && bannerRef.current) {
        const fH = formRef.current.offsetHeight;
        const bH = bannerRef.current.offsetHeight;
        setBannerH(bH);
        // Form theke Banner minus korle je extra space thake
        setHeightDiff(fH - bH);
      }
    };

    // Initial calculation
    calculateHeights();

    // Content load hote deri hole ba resize hole recalculated hobe
    window.addEventListener("resize", calculateHeights);
    return () => window.removeEventListener("resize", calculateHeights);
  }, [isLoginCol]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isLoginCol]);
  const handleSocialLogin = (provider: string) => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };
  return (
    <Card
      className={`max-w-6xl p-0 gap-0 mx-auto grow flex flex-col lg:flex-row items-stretch rounded-lg card h-auto md:overflow-hidden overflow-visible lg:min-h-150 relative ${isLoginCol ? "" : "!lg:mt-0"}`}
      style={
        !isLoginCol && typeof window !== "undefined" && window.innerWidth < 1024
          ? {
              marginTop: `-${heightDiff}px`,
              marginBottom: `${heightDiff}px`,
            }
          : {}
      }
    >
      {/* 1. Form Container */}
      <div
        ref={formRef}
        className={`w-full lg:basis-1/2 flex flex-col justify-center items-center min-h-150 lg:h-auto transition-transform duration-700 
          ${
            isLoginCol
              ? "translate-x-0 translate-y-0"
              : "lg:translate-x-full translate-y-full lg:translate-y-0"
          } 
          z-30 relative`}
      >
        <div
          className={`login w-full lg:px-20 absolute inset-0 flex flex-col justify-center transition-all duration-700 
            ${isLoginCol ? "opacity-100 z-20 blur-0" : "opacity-0 z-10 blur-md"} px-4`}
          style={{
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
          className={`signup w-full lg:px-20 absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 
            ${!isLoginCol ? "opacity-100 z-20 blur-0" : "opacity-0 z-10 blur-md"} px-4`}
          style={{
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

      {/* 2. Banner Container (Desktop e strictly 50% width) */}
      <div
        ref={bannerRef}
        className={`w-full relative lg:basis-1/2 flex flex-col items-center justify-center gap-5 text-center min-h-100 lg:h-auto py-10 px-4 transition-transform duration-700 
          ${
            isLoginCol
              ? "translate-x-0 translate-y-0"
              : "lg:-translate-x-full -translate-y-full lg:translate-y-0"
          } 
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
