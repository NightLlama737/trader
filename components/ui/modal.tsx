"use client"

import { useEffect } from "react";

interface MedalsProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: MedalsProps) {
  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = "hidden";
      
      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose();
        }
      };
      
      document.addEventListener("keydown", handleEscKey);
      return () => {
        document.removeEventListener("keydown", handleEscKey);
        document.documentElement.style.overflow = "";
      };
    } else {
      document.documentElement.style.overflow = "";
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen flex items-center justify-center bg-black/50 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
     
      <div
        className="bg-white p-6 flex flex-col items-center rounded-xl shadow-2xl w-[40%] max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        

        {children}
      </div>
    </div>
  );
}
