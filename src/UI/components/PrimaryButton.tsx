import React from "react";

interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const PrimaryButton = ({ children, className = "", disabled, ...rest }: PrimaryButtonProps) => {
  const base = "rounded-lg p-2";
  const disabledCls = disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-background-light";
  const combined = `${base} ${disabledCls} ${className}`.trim();

  return (
    <button {...rest} disabled={disabled} className={combined}>
      {children}
    </button>
  );
};
