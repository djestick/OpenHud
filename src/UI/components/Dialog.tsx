import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import { useThemes } from "../hooks";

interface DialogProps {
  children?: React.ReactNode;
  onClose?: () => void;
  open?: boolean;
}

export const Dialog = ({ children, onClose, open }: DialogProps) => {
  const { theme } = useThemes();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300); // 300ms matches animation duration
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!isVisible) return null;
  return createPortal(
    <div className={theme}>
      <div
        className={`fixed bottom-0 left-0 right-0 top-0 z-30 bg-black/70 rounded-3xl overflow-hidden backdrop-blur-sm ${isAnimating ? "animate-fade-in" : "animate-fade-out"}`}
        onClick={onClose}
      />
      <div className={`fixed left-1/2 top-1/2 z-30 flex max-h-[90vh] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded border border-border bg-background-primary p-4 text-text shadow-lg ${isAnimating ? "animate-fade-in" : "animate-fade-out"}`}>
        <button
          className="z-4 absolute right-4 top-4 hover:text-gray-400"
          onClick={onClose}
        >
          <MdClose className="size-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
};
