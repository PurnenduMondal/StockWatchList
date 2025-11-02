// Stock symbol validation
export const validateStockSymbol = (symbol) => {
  // Check if symbol exists
  if (!symbol) {
    return {
      isValid: false,
      message: 'Stock symbol is required'
    };
  }

  // Check if symbol is a string
  if (typeof symbol !== 'string') {
    return {
      isValid: false,
      message: 'Stock symbol must be a string'
    };
  }

  // Trim and convert to uppercase
  const trimmedSymbol = symbol.trim().toUpperCase();

  // Check length (1-5 characters)
  if (trimmedSymbol.length < 1 || trimmedSymbol.length > 5) {
    return {
      isValid: false,
      message: 'Stock symbol must be 1-5 characters long'
    };
  }

  // Check if contains only uppercase letters
  const regex = /^[A-Z]{1,5}$/;
  if (!regex.test(trimmedSymbol)) {
    return {
      isValid: false,
      message: 'Stock symbol must contain only uppercase letters (A-Z)'
    };
  }

  // Check for forbidden symbols (if any)
  const forbiddenSymbols = ['NULL', 'ADMIN', 'TEST', 'DEBUG'];
  if (forbiddenSymbols.includes(trimmedSymbol)) {
    return {
      isValid: false,
      message: 'This stock symbol is not allowed'
    };
  }

  return {
    isValid: true,
    symbol: trimmedSymbol
  };
};

// Email validation (for future use)
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      message: 'Email is required'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      message: 'Please provide a valid email address'
    };
  }

  return {
    isValid: true,
    email: email.trim().toLowerCase()
  };
};

// Password validation (for future use)
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required'
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password must not exceed 128 characters'
    };
  }

  // Check for at least one uppercase, one lowercase, one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    };
  }

  return {
    isValid: true
  };
};




