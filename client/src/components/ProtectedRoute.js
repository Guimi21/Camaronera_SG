import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedProfiles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedProfiles && !allowedProfiles.includes(user.tipo_usuario)) {
    return <Navigate to="/home" />;
  }

  return children;
}
