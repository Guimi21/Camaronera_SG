import React from 'react';
import PropTypes from 'prop-types';

// Componente para los botones de acción
const FormActions = ({
  isConsultaMode,
  isDisabled,
  loading,
  submitText,
  submitButtonClassName,
  onCancel
}) => (
  <div className="flex flex-col sm:flex-row gap-4 pt-6">
    {!isConsultaMode && (
      <button
        type="submit"
        disabled={isDisabled}
        className={`flex-1 sm:flex-none px-6 py-3 rounded-md font-medium text-white transition-colors duration-200 ${submitButtonClassName}`}
      >
        {submitText}
      </button>
    )}

    <button
      type="button"
      onClick={onCancel}
      disabled={loading}
      className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
    >
      {isConsultaMode ? 'Volver' : 'Cancelar'}
    </button>
  </div>
);

FormActions.propTypes = {
  isConsultaMode: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  submitText: PropTypes.string.isRequired,
  submitButtonClassName: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired
};

export { FormActions };
