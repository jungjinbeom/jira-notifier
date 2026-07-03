import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

/** 목록 헤더의 텍스트형 액션 버튼(모두 읽음/전체 삭제/새로고침 등). */
export const ActionButton = ({ className = "", children, ...rest }: Props) => {
  return (
    <button className={`notif-action-btn ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
};
