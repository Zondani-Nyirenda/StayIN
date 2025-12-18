// ========================================
// FILE: utils/validators.ts
// Form validation utilities
// ========================================

export interface PasswordValidation {
  valid: boolean;
  message?: string;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validatePassword(password: string): PasswordValidation {
  if (!password || password.length < 6) {
    return {
      valid: false,
      message: 'Password must be at least 6 characters long',
    };
  }

  if (password.length > 50) {
    return {
      valid: false,
      message: 'Password is too long',
    };
  }

  return { valid: true };
}

export function validatePhoneNumber(phone: string): boolean {
  // Zambian phone numbers: +260 or 09 followed by 9 digits
  const phoneRegex = /^(\+260|0)[79]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validateFullName(name: string): boolean {
  if (!name || name.trim().length < 2) {
    return false;
  }
  // Check if name has at least 2 words (first and last name)
  const words = name.trim().split(/\s+/);
  return words.length >= 2 && words.every(word => word.length > 0);
}