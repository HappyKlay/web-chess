import { cn } from "../../utils/tw-utils";

export function Card({ className, children }) {
  return (
    <div className={cn("bg-white bg-opacity-10 backdrop-blur-lg p-4 rounded-2xl shadow-md", className)}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
