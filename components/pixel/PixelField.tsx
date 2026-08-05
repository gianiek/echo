import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type FieldWrapperProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
};

export function PixelFieldWrapper({
  label,
  htmlFor,
  hint,
  children,
}: FieldWrapperProps) {
  return (
    <div className="pixel-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint ? <p className="mt-1.5 text-[0.625rem] text-ink-soft">{hint}</p> : null}
    </div>
  );
}

type PixelInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function PixelInput({ label, hint, id, className = "", ...props }: PixelInputProps) {
  return (
    <PixelFieldWrapper label={label} htmlFor={id!} hint={hint}>
      <input id={id} className={`pixel-input ${className}`} {...props} />
    </PixelFieldWrapper>
  );
}

type PixelTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

export function PixelTextarea({
  label,
  hint,
  id,
  className = "",
  ...props
}: PixelTextareaProps) {
  return (
    <PixelFieldWrapper label={label} htmlFor={id!} hint={hint}>
      <textarea id={id} className={`pixel-textarea ${className}`} {...props} />
    </PixelFieldWrapper>
  );
}

type PixelCheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function PixelCheckbox({ label, id, className = "", ...props }: PixelCheckboxProps) {
  return (
    <label className={`pixel-checkbox ${className}`} htmlFor={id}>
      <input type="checkbox" id={id} {...props} />
      {label}
    </label>
  );
}
