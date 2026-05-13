"use client";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { Button } from "@/app/components/Button";
import { FormInput } from "@/app/components/FormInput";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMeCheckBox: z.boolean().default(false).optional(),
});
type LoginFormInputs = z.infer<typeof loginSchema>;
const LoginForm = () => {
  // const onSubmit = async (data: LoginFormInputs) => {
  //   try {
  //     toast.promise(
  //       signIn("credentials", {
  //         email: data.email,
  //         password: data.password,
  //         redirect: false,
  //       }),
  //       {
  //         loading: "Logging in ",
  //         success: (res) => {
  //           if (res?.error) {
  //             throw new Error(res.error);
  //           }
  //           reset();
  //           router.push("/dashboard");
  //           router.refresh();
  //           return "Login Successful!";
  //         },
  //         error: (err) => {
  //           return err.message || "Invalid Credentials!";
  //         },
  //       },
  //     );
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };
  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMeCheckBox: false,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      toast.promise(
        signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        }),
        {
          loading: "Logging in...",
          success: (res) => {
            if (res?.error) {
              throw new Error(res.error);
            }
            form.reset(); // reset update kora holo
            router.push("/dashboard");
            router.refresh();
            return "Login Successful!";
          },
          error: (err) => {
            return err.message || "Invalid Credentials!";
          },
        },
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form
      id="login-form"
      className="w-full text-center space-y-2 mt-9"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup className="gap-3">
        {/* Email Field */}
        <FormInput
          name="email"
          type="email"
          control={form.control}
          label="Email address"
          placeholder="example@mail.com"
        ></FormInput>

        {/* Password Field */}
        <FormInput
          name="password"
          placeholder="password"
          type={showPassword ? "text" : "password"}
          label="Password"
          control={form.control}
        >
          <div className="relative h-7.50">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute -top-8 right-3 text-lg -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
            >
              {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
            </button>
          </div>
        </FormInput>
        {/* Remember Me Checkbox */}
        <Controller
          name="rememberMeCheckBox"
          control={form.control}
          render={({ field }) => (
            <div className="flex items-center space-x-2 ">
              <Checkbox
                id="rememberMe"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="data-[state=checked]:bg-[#009b9f] data-[state=checked]:border-[#009b9f] border-gray-300 rounded"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-gray-600 cursor-pointer font-normal"
              >
                Remember me
              </label>
            </div>
          )}
        />
      </FieldGroup>

      {/* Submit Button */}
      <Button type="submit" className="mt-4">
        Login
      </Button>
    </form>
  );
};

export default LoginForm;
