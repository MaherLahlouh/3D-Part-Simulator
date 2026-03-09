
//@ts-nocheck
import { authService } from './services/authService.ts';
import { CONFIG } from '../config.ts'

// Password visibility toggle
window.toggleVisibility = function(inputId) {
  const input = document.getElementById(inputId);
  const toggle = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = '🙈';
  } else {
    input.type = 'password';
    toggle.textContent = '👁️';
  }
};

// Form submission handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form values
      const emailOrUsername = document.getElementById('emailOrUsername').value.trim();
      const Password = document.getElementById('password').value;
      
      // Validate input
      if (!emailOrUsername) {
        alert('Please enter your email or username');
        return;
      }
      
      if (!Password) {
        alert('Please enter your password');
        return;
      }
      
      // Show loading state
      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Signing In...';
      
      // Determine if input is email or username
      // Email pattern: contains @ and has valid email format
      // Note: User model has Email field with lowercase: true, so we lowercase it
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailPattern.test(emailOrUsername);
      
      // Prepare request body matching user.js schema and auth-controller.js expectations:
      // - Email: String (lowercase, trim) - if email input
      // - UserName: String (trim) - if username input
      // - Password: String (required)
      // Backend's findUserByEmailOrUsername uses $or: [{ Email: email }, { UserName: username }]
      // Only include the field that has a value (don't send null) for proper MongoDB query handling
      const requestBody = {
        Password: Password // Password field name matches user.js schema
      };
      
      if (isEmail) {
        // Email is automatically lowercased by mongoose schema, but we do it here too for consistency
        requestBody.Email = emailOrUsername.toLowerCase().trim();
      } else {
        // UserName is trimmed by mongoose schema, but we do it here too for consistency
        requestBody.UserName = emailOrUsername.trim();
      }
      
      try {
        // Send login request to backend
        // Backend accepts Email OR UserName (see auth-controller.js)
        const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            
          },
          body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }
        
        // Success - save token and redirect
        if (data.token) {
          authService.setToken(data.token);
          alert(`Welcome back ${data.user.FirstName}!`);
          // Redirect to simulator after successful login
          window.location.href = '/src/client/pages/landing.html';
        } else {
          throw new Error('No token received from server');
        }
        
      } catch (error) {
        console.error('Login error:', error);
        // Handle network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          alert('Cannot connect to server. Please make sure the backend server is running on port 3001.');
        } else {
          alert(error.message || 'Login failed. Please check your credentials and try again.');
        }
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }
});

