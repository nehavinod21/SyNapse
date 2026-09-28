import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log("[ProtectedRoute]", { 
    path: location.pathname,
    allowedRoles, 
    user: user ? { id: user.id, role: user.role } : null, 
    loading 
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.error("[ProtectedRoute] DENIED", { role: user.role, allowed: allowedRoles });
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
