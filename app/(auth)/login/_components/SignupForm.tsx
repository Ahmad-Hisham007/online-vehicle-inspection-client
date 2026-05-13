import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FaRegUser } from "react-icons/fa";
import {
  MdLockOutline,
  MdOutlineEmail,
  MdOutlinePhoneEnabled,
} from "react-icons/md";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type FormInputs = {
  name: string;
  phoneNumber: number;
  email: string;
  password: string;
  confirmPassword: string;
};

interface newUserData {
  status: number;
  message: string;
}

const postFormData = async (formData: FormInputs): Promise<newUserData> => {
  const response = await fetch(
    "https://next-login-page-ten.vercel.app/api/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
      }),
    },
  );
  const data = await response.json();
  return data;
};

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword_2, setShowPassword_2] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormInputs>();
  const password = useWatch({ control, name: "password" });
  const onSubmit = async (data: FormInputs) => {
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

    return data;
  };

  const handleLoginAfterSignup = async (data: FormInputs) => {
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
            reset();
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
      onSubmit={handleSubmit(onSubmit)}
    >
      <label className="input input-md outline-0 focus:border-2 border-[0_0_2_0] focus:border-primary rounded-none">
        <FaRegUser className="opacity-50" />

        <input
          type="text"
          {...register("name")}
          className=" grow"
          placeholder="E.g. John Smith"
        />
      </label>
      <label className="input input-md outline-0 focus:border-2 border-[0_0_2_0] focus:border-primary rounded-none">
        <MdOutlinePhoneEnabled className="opacity-50" />

        <input
          type="text"
          {...register("phoneNumber")}
          className=" grow"
          placeholder="+xx xxx xxxx"
        />
      </label>
      <label className="input input-md outline-0 focus:border-2 border-[0_0_2_0] focus:border-primary rounded-none">
        <MdOutlineEmail className="opacity-50" />

        <input
          type="email"
          {...register("email", {
            required: "Email is required",
            pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
          })}
          className=" grow"
          placeholder="Email address"
        />
      </label>
      <label className="input input-md outline-0 focus:border-2 border-[0_0_2_0] focus:border-primary rounded-none relative">
        <MdLockOutline className="opacity-50" />
        <input
          type={showPassword ? "text" : "password"}
          {...register("password", {
            required: "Password is required",
          })}
          className="grow"
          placeholder="Password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </label>

      <label className="input input-md outline-0 focus:border-2 border-[0_0_2_0] focus:border-primary rounded-none relative">
        <MdLockOutline className="opacity-50" />
        <input
          type={showPassword_2 ? "text" : "password"}
          {...register("confirmPassword", {
            required: "This field is required",
            validate: (value) => value === password || "Passwords do not match",
          })}
          className="grow"
          placeholder="Confirm Password"
        />
        <button
          type="button"
          onClick={() => setShowPassword_2(!showPassword_2)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 z-100"
        >
          {showPassword_2 ? <FaEyeSlash /> : <FaEye />}
        </button>
      </label>
      {errors.confirmPassword && (
        <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>
      )}
      <button
        type="submit"
        className="w-full btn border-0 btn-lg rounded-3xl bg-linear-to-br from-primary to-secondary text-white uppercase text-sm mt-4"
      >
        Signup
      </button>
    </form>
  );
};

export default SignupForm;
