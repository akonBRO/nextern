'use client';
import { Children, cloneElement, isValidElement, useId, type ReactNode } from 'react';

type ControlProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
};
export default function FormField({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  const items = Children.toArray(children);
  const first = items.find(
    (child) =>
      isValidElement<ControlProps>(child) &&
      typeof child.type === 'string' &&
      ['input', 'select', 'textarea'].includes(child.type)
  );
  const id = isValidElement<ControlProps>(first) ? (first.props.id ?? generatedId) : generatedId;
  return (
    <div className="form-field">
      <label className="form-field-label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {items.map((child) =>
        child === first && isValidElement<ControlProps>(child)
          ? cloneElement(child, {
              id,
              'aria-invalid': error ? true : child.props['aria-invalid'],
              'aria-required': required || child.props['aria-required'],
              'aria-describedby':
                [child.props['aria-describedby'], error ? `${generatedId}-error` : null]
                  .filter(Boolean)
                  .join(' ') || undefined,
            })
          : child
      )}
      {error && (
        <p className="form-field-error" id={`${generatedId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
