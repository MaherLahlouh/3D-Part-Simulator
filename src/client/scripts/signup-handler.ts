// Signup Form Handler
// Connects signup form to backend API matching user.js schema
// @ts-nocheck

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

// Password strength checker
function checkPasswordStrength(password) {
  const strengthDiv = document.getElementById('passwordStrength');
  if (!strengthDiv) return;
  
  let strength = 0;
  let feedback = '';
  
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  switch (strength) {
    case 0:
    case 1:
      feedback = '<span style="color: #e74c3c;">Weak</span>';
      break;
    case 2:
    case 3:
      feedback = '<span style="color: #f39c12;">Medium</span>';
      break;
    case 4:
    case 5:
      feedback = '<span style="color: #27ae60;">Strong</span>';
      break;
  }
  
  strengthDiv.innerHTML = feedback;
}

// Password match checker
function checkPasswordMatch() {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const matchDiv = document.getElementById('passwordMatch');
  
  if (!matchDiv) return;
  
  if (confirmPassword === '') {
    matchDiv.innerHTML = '';
    return;
  }
  
  if (password === confirmPassword) {
    matchDiv.innerHTML = '<span style="color: #27ae60;">✓ Passwords match</span>';
  } else {
    matchDiv.innerHTML = '<span style="color: #e74c3c;">✗ Passwords do not match</span>';
  }
}

// Form submission handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  
  // Password strength checker
  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      checkPasswordStrength(e.target.value);
      checkPasswordMatch();
    });
  }
  
  // Password match checker
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
  }
  
  // Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form values matching user.js schema exactly
      // All field names must match: UserName, FirstName, LastName, Email, Password, Role, Institution, Country, PhoneNumber
      const UserName = document.getElementById('username').value.trim();
      const FirstName = document.getElementById('firstName').value.trim();
      const LastName = document.getElementById('lastName').value.trim();
      const Email = document.getElementById('email').value.trim().toLowerCase();
      const Password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const Role = document.getElementById('role').value;
      const Institution = document.getElementById('institution').value.trim();
      const Country = document.getElementById('country').value.trim();
      const PhoneNumber = document.getElementById('phoneNumber').value.trim();
      
      // Validate required fields matching user.js schema
      if (!UserName) {
        alert('Username is required!');
        return;
      }
      
      if (!FirstName) {
        alert('First name is required!');
        return;
      }
      
      if (!LastName) {
        alert('Last name is required!');
        return;
      }
      
      // Email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!Email || !emailPattern.test(Email)) {
        alert('Please enter a valid email address!');
        return;
      }
      
      // Password validation
      if (!Password) {
        alert('Password is required!');
        return;
      }
      
      if (Password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      
      if (Password.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
      }
      
      // Role validation - must match user.js enum: 'user', 'teacher', 'admin'
      const validRoles = ['user', 'teacher', 'admin'];
      if (!Role || !validRoles.includes(Role)) {
        alert('Please select a valid role!');
        return;
      }
      
      if (!Institution) {
        alert('Institution is required!');
        return;
      }
      
      if (!Country) {
        alert('Country is required!');
        return;
      }
      
      if (!PhoneNumber || PhoneNumber.trim() === '') {
        alert('Phone number is required!');
        return;
      }
      
      // Show loading state
      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Creating Account...';
      
      try {
        // Prepare request body matching user.js schema exactly
        // PhoneNumber is now required (same as other fields)
        const requestBody = {
          UserName: UserName, // String, required, unique, trim
          FirstName: FirstName, // String, required, trim
          LastName: LastName, // String, required, trim
          Email: Email, // String, required, unique, lowercase, trim (already lowercased)
          Password: Password, // String, required (will be hashed by backend)
          Role: Role, // String, required, enum: ['user', 'teacher', 'admin']
          Institution: Institution, // String, required
          Country: Country, // String, required
          PhoneNumber: PhoneNumber.trim() // String, required (same as other fields)
        };
        
        // Send registration request to backend
        const response = await fetch(`${CONFIG.API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }
        
        // Success - save token and redirect
        if (data.token) {
          authService.setToken(data.token);
          alert(`Welcome ${data.user.FirstName}! Registration successful.`);
          // Redirect to index.html after successful signup
          window.location.href = '/src/client/pages/index.html';
        } else {
          throw new Error('No token received from server');
        }
        
      } catch (error) {
        console.error('Registration error:', error);
        // Handle network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          alert('Cannot connect to server. Please make sure the backend server is running on port 3001.');
        } else {
          alert(error.message || 'Registration failed. Please try again.');
        }
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }
});

