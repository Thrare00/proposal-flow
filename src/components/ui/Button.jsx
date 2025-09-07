import React from "react";

export const Button = React.forwardRef(({ 
  className = "", 
  variant = "default", 
  ...props 
}, ref) => {
  const style = variant === "outline" ? "border bg-white" : "bg-black text-white";
  return <button ref={ref} className={`px-4 py-2 rounded ${style} ${className}`} {...props} />;
});
Button.displayName = "Button";

export default Button;
