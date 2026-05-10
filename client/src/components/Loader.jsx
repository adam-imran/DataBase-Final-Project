export default function Loader({ message = 'Loading data...' }) {
  return (
    <div className="loader-wrapper">
      <div className="spinner"></div>
      <span>{message}</span>
    </div>
  )
}
