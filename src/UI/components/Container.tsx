import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Container = ({ children, className = "", ...rest }: ContainerProps) => {
  return (
    <div
      className={`container mx-auto flex h-full w-full flex-col overflow-x-hidden px-4 sm:px-6 lg:px-8 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
