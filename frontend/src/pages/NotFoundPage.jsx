import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { HOME_BY_ROLE } from '../config/navigation';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  const { user } = useAuth();
  const home = user ? HOME_BY_ROLE[user.role] : '/login';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F8FC] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-glow">
        <Compass className="h-8 w-8" />
      </div>
      <p className="mt-6 text-[64px] font-extrabold leading-none tracking-tight text-navy-900">404</p>
      <h1 className="mt-2 text-lg font-bold text-navy-900">This page wandered off the menu</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you are looking for doesn’t exist or may have moved. Let’s get you back to your dashboard.
      </p>
      <Link to={home} className="mt-6">
        <Button variant="indigo" icon={Home}>Back to dashboard</Button>
      </Link>
    </div>
  );
}
