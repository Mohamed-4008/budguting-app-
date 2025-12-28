// Utility functions for handling errors in the frontend

// Handle API errors
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 400:
        return error.response.data.message || 'Bad Request';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'Forbidden. You do not have permission to access this resource.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Internal server error. Please try again later.';
      default:
        return `Server error: ${error.response.status}`;
    }
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection and try again.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred.';
  }
};

// Handle form validation errors
export const handleFormErrors = (errors: any): string => {
  if (typeof errors === 'string') {
    return errors;
  }
  
  if (Array.isArray(errors)) {
    return errors.join(', ');
  }
  
  if (typeof errors === 'object') {
    return Object.values(errors).join(', ');
  }
  
  return 'Validation error occurred.';
};

export default {
  handleApiError,
  handleFormErrors
};