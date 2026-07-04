import { cn } from "../../lib/utils";
import * as React from "react";

const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full bg-white/5 border border-transparent focus-visible:border-white/20 text-white placeholder:text-white/30 h-10 rounded-lg transition-all duration-300 px-3 focus-visible:bg-white/10 outline-none text-sm disabled:cursor-not-allowed disabled:opacity-50",
          type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
          type === "file" &&
            "p-0 pr-3 italic text-gray-400 file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:border-white/20 file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic file:text-white",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
