import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/AuthContext";

// Requires a logged-in user (and optionally a role). Forces a password change first when required.
const ProtectedRoute = ({ role }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (user.must_change_password && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (role && user.role !== role) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
