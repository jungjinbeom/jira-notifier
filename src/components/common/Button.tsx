import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "success" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

/** 공용 버튼. variant로 색상, fullWidth로 폭을 정하고 나머지 button 속성은 그대로 전달된다. */
export const Button = ({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: Props) => {
  const classes = [
    "btn",
    `btn-${variant}`,
    fullWidth ? "btn-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};
