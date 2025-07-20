export const Input = ({ label, ...props }) => {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          {label}
        </label>
        <input
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #cbd5e0',
            fontSize: '1rem',
          }}
          {...props}
        />
      </div>
    );
  };