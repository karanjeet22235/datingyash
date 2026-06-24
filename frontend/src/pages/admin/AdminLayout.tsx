import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  if (!sessionStorage.getItem('adminSecret')) {
    navigate('/admin/login');
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <div className="flex gap-4 text-sm font-medium">
          <Link to="/admin/dashboard" className="hover:text-brand-600">Dashboard</Link>
          <Link to="/admin/reports" className="hover:text-brand-600">Reports</Link>
          <Link to="/admin/verification" className="hover:text-brand-600">Verification Queue</Link>
          <button onClick={() => { sessionStorage.removeItem('adminSecret'); navigate('/admin/login'); }} className="text-red-600">Logout</button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
