import { cn } from "../../utils/tw-utils";

export function Button({ className, children, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-semibold transition-all",
        "bg-blue-500 text-white hover:bg-blue-600 active:scale-95",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
