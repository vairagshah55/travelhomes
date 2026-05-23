// Onboarding form validation utilities

export const validateActivityForm = (formData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!formData.activityName || !formData.activityName.trim()) {
    errors.push('Activity name is required');
  }

  if (!formData.selectedActivities || formData.selectedActivities.length === 0) {
    errors.push('Please select at least one activity type');
  }

  if (!formData.regularPrice || Number(formData.regularPrice) <= 0) {
    errors.push('Please enter a valid price');
  }

  if (!formData.description || formData.description.trim().length < 10) {
    errors.push('Please provide a detailed description (minimum 10 characters)');
  }

  if (!formData.location || !formData.location.city) {
    errors.push('Please select a city for your activity');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCaravanForm = (formData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!formData.name || !formData.name.trim()) {
    errors.push('Caravan name is required');
  }

  if (!formData.category) {
    errors.push('Please select a caravan category');
  }

  if (!formData.perDayCharge || Number(formData.perDayCharge) <= 0) {
    errors.push('Please enter a valid per day charge');
  }

  if (!formData.seatingCapacity || Number(formData.seatingCapacity) <= 0) {
    errors.push('Please specify seating capacity');
  }

  if (!formData.description || formData.description.trim().length < 10) {
    errors.push('Please provide a detailed description (minimum 10 characters)');
  }

  if (!formData.locality || !formData.city) {
    errors.push('Please specify location details');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateStayForm = (formData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!formData.selectedProperties || formData.selectedProperties.length === 0) {
    errors.push('Please select at least one property type');
  }

  if (!formData.regularPrice || Number(formData.regularPrice) <= 0) {
    errors.push('Please enter a valid regular price');
  }

  if (!formData.guestCapacity || Number(formData.guestCapacity) <= 0) {
    errors.push('Please enter a valid guest capacity');
  }

  if (!formData.numberOfRooms || Number(formData.numberOfRooms) <= 0) {
    errors.push('Please specify number of rooms');
  }

  if (!formData.brandName || !formData.brandName.trim()) {
    errors.push('Brand name is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const showValidationErrors = (errors: string[]) => {
  // This can be used with toast to show all validation errors
  errors.forEach(error => {
    // Using a slight delay to show multiple toasts
    setTimeout(() => {
      const { toast } = require('sonner');
      toast.error(error);
    }, 100);
  });
};