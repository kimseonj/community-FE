export function FormField({ label, error, children }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {error && <em>{error}</em>}
    </label>
  );
}
