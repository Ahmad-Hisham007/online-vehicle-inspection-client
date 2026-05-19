import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/app/components/Button";
import { FieldGroup } from "@/components/ui/field";
import { FormInput } from "@/app/components/FormInput";
import { env } from "process";

const SignupFormSchema = z
  .object({
    firstName: z.string().min(1, "Firstname is required"),
    lastName: z.string().min(1, "Lastname is required"),
    phoneNumber: z.string().min(1, "Phone number is required"), // 👈 number না, string
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "This field is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupInputType = z.infer<typeof SignupFormSchema>;

interface newUserData {
  status: number;
  message: string;
}

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword_2, setShowPassword_2] = useState(false);
  const router = useRouter();

  const form = useForm<SignupInputType>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("password");

  // Processing form data
  const postFormData = async (
    formData: SignupInputType,
  ): Promise<newUserData> => {
    const response = await fetch(`/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
      }),
    });
    const data = await response.json();
    return data;
  };

  // Submit function
  const onSubmit = async (data: SignupInputType) => {
    try {
      toast.promise(postFormData(data), {
        loading: "Creating account...",
        success: (res: newUserData) => {
          if (res.status === 200 || res.status === 201) {
            handleLoginAfterSignup(data);
            return `Success: ${res.message}`;
          } else {
            throw new Error(res.message);
          }
        },
        error: (err) => {
          console.log(err);
          return err.message || "Could not register!";
        },
      });
    } catch (err) {
      console.error(err);
    }
    console.log(data);
    return data;
  };

  // Login function
  const handleLoginAfterSignup = async (data: SignupInputType) => {
    try {
      toast.promise(
        signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        }),
        {
          loading: "Logging in",
          success: (res) => {
            if (res?.error) {
              throw new Error(res.error);
            }
            form.reset();
            router.push("/dashboard");
            router.refresh();
            return "Logged in. Redirecting...";
          },
          error: (err) => {
            console.log(err);
            router.push("/login");
            return "Login failed";
          },
        },
      );
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <form
      className="h-auto w-full text-center space-y-4 inline-block [&_label]:w-full"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup className="gap-3">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          {/* Name Field */}
          <FormInput
            name="firstName"
            type="text"
            control={form.control}
            label="First Name"
            placeholder="E.g. John"
          ></FormInput>
          <FormInput
            name="lastName"
            type="text"
            control={form.control}
            label="Last Name"
            placeholder="E.g. Smith"
          ></FormInput>
        </div>

        {/* Phone Number Field */}
        <FormInput
          name="phoneNumber"
          type="text"
          control={form.control}
          label="Phone Number"
          placeholder="+xx xxx xxxx"
        ></FormInput>

        {/* Email Field */}
        <FormInput
          name="email"
          type="email"
          control={form.control}
          label="Email address"
          placeholder="Email address"
        ></FormInput>

        {/* Password Field */}
        <FormInput
          name="password"
          type={showPassword ? "text" : "password"}
          control={form.control}
          label="Password"
          placeholder="Password"
        >
          <div className="relative h-7.50">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute -top-8 right-3 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </FormInput>

        {/* Confirm Password Field */}
        <FormInput
          name="confirmPassword"
          type={showPassword_2 ? "text" : "password"}
          control={form.control}
          label="Confirm Password"
          placeholder="Confirm Password"
        >
          <div className="relative h-7.50">
            <button
              type="button"
              onClick={() => setShowPassword_2(!showPassword_2)}
              className="absolute -top-8 right-3 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors z-10"
            >
              {showPassword_2 ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </FormInput>
      </FieldGroup>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full btn border-0 btn-lg rounded-3xl from-primary to-secondary text-white uppercase text-sm mt-4"
      >
        Signup
      </Button>
    </form>
  );
};

export default SignupForm;
