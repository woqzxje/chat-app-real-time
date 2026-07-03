import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

function WaveText({
    text = "Hover me",
    className = "",
}) {
    return (
        <motion.span
            className={cn(
                "inline-block cursor-pointer transition-all",
                className
            )}
            whileHover="hover"
            initial="initial"
        >
            {text.split("").map((char, index) => (
                <motion.span
                    key={index}
                    className="inline-block"
                    variants={{
                        initial: {
                            y: 0,
                            scale: 1,
                        },
                        hover: {
                            y: -4,
                            scale: 1.2,
                            transition: {
                                type: "spring",
                                stiffness: 300,
                                damping: 15,
                                delay: index * 0.03,
                            },
                        },
                    }}
                >
                    {/* Preserve spaces by using non-breaking space if it's a space character */}
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </motion.span>
    );
}

export { WaveText };
