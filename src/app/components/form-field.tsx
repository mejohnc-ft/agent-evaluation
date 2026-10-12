// Labelled input or textarea with an inline, programmatically associated error.
// 44px controls; 16px text on phones so iOS Safari doesn't zoom on focus, Callout from sm up.
const control =
  "block w-full rounded-input border bg-surface px-3 text-body text-ink placeholder:text-faint transition-[border-color,box-shadow] duration-300 ease-out-expo focus:outline-none focus:ring-[3px] focus-visible:outline-none disabled:bg-sunken disabled:text-muted sm:text-callout";

export function FormField({
  id,
  label,
  hint,
  error,
  multiline,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const errorId = `${id}-error`;
  const tone = error
    ? "border-accent-ink focus:ring-accent-soft"
    : "border-hairline-strong focus:border-ink/60 focus:ring-ink/8";
  const shared = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  };

  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between text-footnote font-medium text-ink">
        {label}
        {hint && <span className="text-caption font-normal text-muted">{hint}</span>}
      </label>
      {multiline ? (
        <textarea rows={3} {...props} {...shared} className={`${control} ${tone} resize-none py-2.5`} />
      ) : (
        <input {...props} {...shared} className={`${control} ${tone} h-11`} />
      )}
      {error && (
        <p id={errorId} className="mt-2 text-footnote text-accent-ink">
          {error}
        </p>
      )}
    </div>
  );
}
