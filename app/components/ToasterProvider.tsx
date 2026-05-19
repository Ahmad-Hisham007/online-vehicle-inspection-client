"use client";

import { Toaster } from "react-hot-toast";

export const ToasterProvider = () => {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
        style: {
          background: "#363636",
          color: "#fff",
        },
      }}
    />
  );
};
