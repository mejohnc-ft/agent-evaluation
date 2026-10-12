// Labelled input or textarea with an inline, programmatically associated error.
const control =
  "block w-full rounded-input border bg-surface px-3 py-2.5 text-base leading-6 text-ink placeholder:text-faint transition-[border-color,box-shadow] duration-300 ease-out-expo focus:outline-none focus-visible:outline-none focus:ring-4 disabled:bg-sunken disabled:text-muted sm:text-[0.9375rem]";

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
    ? "border-accent-ink focus:ring-accent/15"
    : "border-hairline-strong focus:border-ink/50 focus:ring-ink/5";
  const shared = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    className: `${control} ${tone}`,
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
        {label}
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </label>
      {multiline ? <textarea rows={3} {...props} {...shared} /> : <input {...props} {...shared} />}
      {error && (
        <p id={errorId} className="mt-1.5 text-[0.8125rem] text-accent-ink">
          {error}
        </p>
      )}
    </div>
  );
}
