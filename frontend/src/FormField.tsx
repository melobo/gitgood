import { FormFieldProperties } from './types';

export function FormField({ label, error, children }: FormFieldProperties): React.ReactElement {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
