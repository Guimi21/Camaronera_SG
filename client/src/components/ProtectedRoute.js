import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedProfiles }) {
  const { user, perfilActivo } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedProfiles && !allowedProfiles.includes(perfilActivo)) {
    return <Navigate to="/home" />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedProfiles: PropTypes.arrayOf(PropTypes.string)
};
