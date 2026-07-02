export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      {message && <p>{message}</p>}
    </div>
  );
}
