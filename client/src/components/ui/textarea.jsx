import * as React from "react";

import { cn } from "../../lib/utils";

const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full bg-white/5 border border-transparent focus-visible:border-white/20 text-white placeholder:text-white/30 rounded-lg transition-all duration-300 px-3 py-3 focus-visible:bg-white/10 outline-none text-sm resize-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
