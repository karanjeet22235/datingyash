import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-brand-600">DateInIndia</Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          {user ? (
            <>
              <Link to="/browse" className="hover:text-brand-600">Browse</Link>
              <Link to="/liked-you" className="hover:text-brand-600">Liked You</Link>
              <Link to="/messages" className="hover:text-brand-600">Messages</Link>
              <Link to="/verification" className="hover:text-brand-600">Verify</Link>
              <Link to="/premium" className="hover:text-brand-600">Premium</Link>
              <Link to="/profile/me" className="hover:text-brand-600">My Profile</Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/trust" className="hover:text-brand-600">Trust &amp; Safety</Link>
              <Link to="/safety-tips" className="hover:text-brand-600">Safety Tips</Link>
              <Link to="/login" className="px-4 py-1.5 rounded-full bg-brand-600 text-white hover:bg-brand-700">
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
