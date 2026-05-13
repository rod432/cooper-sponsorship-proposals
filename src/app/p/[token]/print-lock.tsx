"use client";

import { useEffect } from "react";

// Adds the `print-locked` class to <body> so the @media print CSS in
// globals.css can hide the proposal until it has been signed.
export default function PrintLock() {
  useEffect(() => {
    document.body.classList.add("print-locked");
    return () => {
      document.body.classList.remove("print-locked");
    };
  }, []);
  return null;
}
