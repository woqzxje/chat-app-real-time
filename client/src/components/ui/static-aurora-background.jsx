import { cn } from "../../lib/utils";

export const StaticAuroraBackground = ({
  className,
  children,
  theme = "light",
  ...props
}) => {
  const isLight = theme === "light";
  const cyanRgb = "0,207,255";

  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col w-full items-center justify-center transition-colors duration-500 overflow-hidden",
        isLight ? "bg-[#fff2d7] text-slate-900" : "bg-black text-white",
        className
      )}
      {...props}
    >
      {/* Light mode: Aurora Background */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-transform duration-[600ms] ease-in-out will-change-transform transform-gpu",
          isLight ? "translate-x-0 translate-y-0" : "translate-x-[20%] -translate-y-[150%]"
        )}
      >
        <div
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)]
            [--aurora:repeating-linear-gradient(100deg,#fb923c_10%,#f87171_15%,#f97316_20%,#fdba74_25%,#fb923c_30%)]
            [background-image:var(--white-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:[background-size:200%,_100%] 
            after:mix-blend-difference
            absolute -inset-[10px] opacity-50
            [mask-image:radial-gradient(100%_100%_at_100%_0%,black_40%,transparent_100%)]
            `
          )}
        ></div>
      </div>

      {/* Dark mode: Radial gradient and overlays */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500 pointer-events-none will-change-opacity",
          isLight ? "opacity-0" : "opacity-100"
        )}
      >
        {/* Radial gradient góc trên trái */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(100% 100% at 0% 0%, rgb(46,46,46) 0%, rgb(0,0,0) 100%)',
            mask: 'radial-gradient(125% 100% at 0% 0%, rgb(0,0,0) 0%, rgba(0,0,0,0.224) 88.2883%, rgba(0,0,0,0) 100%)',
            WebkitMask: 'radial-gradient(125% 100% at 0% 0%, rgb(0,0,0) 0%, rgba(0,0,0,0.224) 88.2883%, rgba(0,0,0,0) 100%)',
          }}
        />
        {/* Texture image pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.05] bg-repeat"
          style={{
            backgroundImage: 'url("https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png")',
            backgroundSize: '149.76px',
          }}
        />
        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.15,
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Subtle radial highlight */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(100,116,139,0.2) 0%, transparent 50%, transparent 100%)',
          }}
        />
      </div>

      {/* 5 tia sáng cyan (always active, but moves based on theme) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-[600ms] ease-in-out will-change-transform transform-gpu",
            isLight ? "-translate-x-[140%] -translate-y-[150%]" : "translate-x-0 translate-y-0"
          )}
        >
          {/* Tia sáng 1 */}
          <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(rgb(${cyanRgb}) 0%, rgba(${cyanRgb},0) 100%)`, mask: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgb(0,0,0) 20%, rgba(0,0,0,0) 36%, rgb(0,0,0) 55%, rgba(0,0,0,0.13) 67%, rgb(0,0,0) 78%, rgba(0,0,0,0) 97%)', WebkitMask: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgb(0,0,0) 20%, rgba(0,0,0,0) 36%, rgb(0,0,0) 55%, rgba(0,0,0,0.13) 67%, rgb(0,0,0) 78%, rgba(0,0,0,0) 97%)', transform: 'skewX(45deg)' }} />
          {/* Tia sáng 2 */}
          <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(rgb(${cyanRgb}) 0%, rgba(${cyanRgb},0) 100%)`, mask: 'linear-gradient(90deg, rgba(0,0,0,0) 11%, rgb(0,0,0) 25%, rgba(0,0,0,0.55) 41%, rgba(0,0,0,0.13) 67%, rgb(0,0,0) 78%, rgba(0,0,0,0) 97%)', WebkitMask: 'linear-gradient(90deg, rgba(0,0,0,0) 11%, rgb(0,0,0) 25%, rgba(0,0,0,0.55) 41%, rgba(0,0,0,0.13) 67%, rgb(0,0,0) 78%, rgba(0,0,0,0) 97%)', transform: 'skewX(45deg)' }} />
          {/* Tia sáng 3 */}
          <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(rgb(${cyanRgb}) 0%, rgba(${cyanRgb},0) 100%)`, mask: 'linear-gradient(90deg, rgba(0,0,0,0) 9%, rgb(0,0,0) 20%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.424) 40%, rgb(0,0,0) 48%, rgba(0,0,0,0.267) 54%, rgba(0,0,0,0.13) 78%, rgb(0,0,0) 88%, rgba(0,0,0,0) 97%)', WebkitMask: 'linear-gradient(90deg, rgba(0,0,0,0) 9%, rgb(0,0,0) 20%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.424) 40%, rgb(0,0,0) 48%, rgba(0,0,0,0.267) 54%, rgba(0,0,0,0.13) 78%, rgb(0,0,0) 88%, rgba(0,0,0,0) 97%)', transform: 'skewX(45deg)' }} />
          {/* Tia sáng 4 */}
          <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(rgb(${cyanRgb}) 0%, rgba(${cyanRgb},0) 100%)`, mask: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgb(0,0,0) 17%, rgba(0,0,0,0.55) 26%, rgb(0,0,0) 35%, rgba(0,0,0,0) 47%, rgba(0,0,0,0.13) 69%, rgb(0,0,0) 79%, rgba(0,0,0,0) 97%)', WebkitMask: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgb(0,0,0) 17%, rgba(0,0,0,0.55) 26%, rgb(0,0,0) 35%, rgba(0,0,0,0) 47%, rgba(0,0,0,0.13) 69%, rgb(0,0,0) 79%, rgba(0,0,0,0) 97%)', transform: 'skewX(45deg)' }} />
          {/* Tia sáng 5 */}
          <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(rgb(${cyanRgb}) 0%, rgba(${cyanRgb},0) 100%)`, mask: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgb(0,0,0) 20%, rgba(0,0,0,0.55) 27%, rgb(0,0,0) 42%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.13) 67%, rgb(0,0,0) 74%, rgb(0,0,0) 82%, rgba(0,0,0,0.47) 88%, rgba(0,0,0,0) 97%)', WebkitMask: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgb(0,0,0) 20%, rgba(0,0,0,0.55) 27%, rgb(0,0,0) 42%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.13) 67%, rgb(0,0,0) 74%, rgb(0,0,0) 82%, rgba(0,0,0,0.47) 88%, rgba(0,0,0,0) 97%)', transform: 'skewX(45deg)' }} />
        </div>
      </div>

      <div className="absolute inset-0 z-10">{children}</div>
    </div>
  );
};
