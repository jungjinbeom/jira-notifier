import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

/** 라벨 + 입력 + 힌트 한 벌. 나머지 input 속성은 그대로 전달된다. */
export function FormField({ label, hint, ...inputProps }: Props) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" {...inputProps} />
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}
