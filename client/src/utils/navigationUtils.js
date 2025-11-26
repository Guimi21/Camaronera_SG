/**
 * Utility functions for navigation based on user profile
 */

/**
 * Navigate to the appropriate dashboard based on the active profile
 * @param {Function} navigate - React Router navigate function
 * @param {string} perfilActivo - The active user profile
 */
export const handleNavigationByProfile = (navigate, perfilActivo) => {
  if (perfilActivo === 'Superadministrador') {
    navigate('/layout/dashboard/usuarios-admin');
  } else {
    navigate('/layout/dashboard/usuarios');
  }
};
