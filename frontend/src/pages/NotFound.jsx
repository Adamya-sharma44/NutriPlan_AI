import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page not-found">
      <h1 className="page__title">Page not found</h1>
      <p className="page__subtitle">
        The page you were looking for does not exist or has moved.
      </p>
      <Link to="/" className="btn btn--primary">
        Back to home
      </Link>
    </div>
  );
}
