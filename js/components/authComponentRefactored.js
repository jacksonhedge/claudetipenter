/**
 * Refactored Authentication Component for TipEnter
 * Provides UI and functionality for both Business and User authentication
 */

import supabaseService from '../services/supabaseService.js';

class AuthComponentRefactored {
  constructor(options = {}) {
    this.options = {
      containerId: 'authContainer',
      onAuthStateChanged: null,
      redirectAfterLogin: null,
      ...options
    };
    
    this.currentView = 'selection'; // 'selection', 'login', 'signup-business', 'signup-user', 'reset-password'
    this.userType = null; // 'business' or 'user'
    this.isLoading = false;
    
    this.init();
  }
  
  async init() {
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      console.error(`Auth container with ID "${this.options.containerId}" not found`);
      return;
    }
    
    const user = supabaseService.getCurrentUser();
    if (user) {
      this.handleAuthStateChanged(user);
    } else {
      this.renderUserTypeSelection();
    }
  }
  
  /**
   * Render user type selection
   */
  renderUserTypeSelection() {
    this.currentView = 'selection';
    this.container.innerHTML = `
      <div class="auth-selection">
        <h1>Welcome to TipEnter</h1>
        <p class="subtitle">Choose how you'd like to get started</p>
        
        <div class="selection-cards">
          <div class="selection-card business-card" id="selectBusiness">
            <div class="card-icon">
              <i class="fas fa-building"></i>
            </div>
            <h2>I'm a Business Owner</h2>
            <p>Manage receipts, track tips, and streamline your restaurant operations</p>
            <ul class="benefits">
              <li><i class="fas fa-check"></i> Receipt scanning & management</li>
              <li><i class="fas fa-check"></i> Team collaboration</li>
              <li><i class="fas fa-check"></i> Analytics & reporting</li>
            </ul>
            <button class="selection-btn business-btn">Get Started as Business</button>
          </div>
          
          <div class="selection-card user-card" id="selectUser">
            <div class="card-icon">
              <i class="fas fa-user"></i>
            </div>
            <h2>I'm a Team Member</h2>
            <p>Track your tips, view your earnings, and manage your shifts</p>
            <ul class="benefits">
              <li><i class="fas fa-check"></i> Personal tip tracking</li>
              <li><i class="fas fa-check"></i> Earnings dashboard</li>
              <li><i class="fas fa-check"></i> Shift management</li>
            </ul>
            <button class="selection-btn user-btn">Get Started as User</button>
          </div>
        </div>
        
        <div class="existing-account">
          <p>Already have an account? <a href="#" id="existingAccountLink">Sign In</a></p>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('selectBusiness').addEventListener('click', () => {
      this.userType = 'business';
      this.renderSignupForm('business');
    });
    
    document.getElementById('selectUser').addEventListener('click', () => {
      this.userType = 'user';
      this.renderSignupForm('user');
    });
    
    document.getElementById('existingAccountLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderLoginForm();
    });
  }
  
  /**
   * Render login form
   */
  renderLoginForm() {
    this.currentView = 'login';
    this.container.innerHTML = `
      <div class="auth-form login-form">
        <div class="form-header">
          <a href="#" class="back-link" id="backToSelection">
            <i class="fas fa-arrow-left"></i> Back
          </a>
          <h2>Sign In</h2>
        </div>
        
        <form id="loginForm">
          <div class="form-group">
            <label for="loginEmail">Email</label>
            <input type="email" id="loginEmail" required placeholder="Enter your email">
          </div>
          <div class="form-group">
            <label for="loginPassword">Password</label>
            <input type="password" id="loginPassword" required placeholder="Enter your password">
          </div>
          <div class="form-actions">
            <button type="submit" class="primary-btn" id="loginButton">
              <span class="btn-text">Sign In</span>
              <span class="btn-loader" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
            </button>
          </div>
          <div class="form-links">
            <a href="#" id="forgotPasswordLink">Forgot Password?</a>
            <a href="#" id="signupLink">Don't have an account? Sign Up</a>
          </div>
        </form>
        <div class="auth-error" id="loginError" style="display: none;"></div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('backToSelection').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderUserTypeSelection();
    });
    
    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    
    document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderResetPasswordForm();
    });
    
    document.getElementById('signupLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderUserTypeSelection();
    });
  }
  
  /**
   * Render signup form based on user type
   */
  renderSignupForm(type) {
    this.currentView = `signup-${type}`;
    this.userType = type;
    
    const businessFields = `
      <div class="form-group">
        <label for="businessName">Business Name</label>
        <input type="text" id="businessName" required placeholder="Enter your business name">
      </div>
      <div class="form-group">
        <label for="businessType">Business Type</label>
        <select id="businessType" required>
          <option value="">Select business type</option>
          <option value="restaurant">Restaurant</option>
          <option value="bar">Bar</option>
          <option value="cafe">Cafe</option>
          <option value="hotel">Hotel</option>
          <option value="other">Other</option>
        </select>
      </div>
    `;
    
    const userFields = `
      <div class="form-row">
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input type="text" id="firstName" required placeholder="First name">
        </div>
        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input type="text" id="lastName" required placeholder="Last name">
        </div>
      </div>
      <div class="form-group">
        <label for="inviteCode">Invite Code (Optional)</label>
        <input type="text" id="inviteCode" placeholder="Enter business invite code">
      </div>
    `;
    
    this.container.innerHTML = `
      <div class="auth-form signup-form ${type}-signup">
        <div class="form-header">
          <a href="#" class="back-link" id="backToSelection">
            <i class="fas fa-arrow-left"></i> Back
          </a>
          <h2>Create ${type === 'business' ? 'Business' : 'User'} Account</h2>
        </div>
        
        <form id="signupForm">
          ${type === 'business' ? businessFields : userFields}
          
          <div class="form-group">
            <label for="signupEmail">Email</label>
            <input type="email" id="signupEmail" required placeholder="Enter your email">
          </div>
          
          <div class="form-group">
            <label for="signupPhone">Phone Number</label>
            <input type="tel" id="signupPhone" required placeholder="(555) 123-4567">
          </div>
          
          <div class="form-group">
            <label for="signupPassword">Password</label>
            <input type="password" id="signupPassword" required placeholder="Create a password">
          </div>
          
          <div class="form-group">
            <label for="signupConfirmPassword">Confirm Password</label>
            <input type="password" id="signupConfirmPassword" required placeholder="Confirm your password">
          </div>
          
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" id="termsCheckbox" required>
              I agree to the <a href="/terms" target="_blank">Terms of Service</a> and 
              <a href="/privacy" target="_blank">Privacy Policy</a>
            </label>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="primary-btn" id="signupButton">
              <span class="btn-text">Create Account</span>
              <span class="btn-loader" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
            </button>
          </div>
          
          <div class="form-links">
            <a href="#" id="loginLink">Already have an account? Sign In</a>
          </div>
        </form>
        <div class="auth-error" id="signupError" style="display: none;"></div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('backToSelection').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderUserTypeSelection();
    });
    
    document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));
    
    document.getElementById('loginLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderLoginForm();
    });
    
    // Phone number formatting
    const phoneInput = document.getElementById('signupPhone');
    phoneInput.addEventListener('input', (e) => {
      this.formatPhoneNumber(e.target);
    });
  }
  
  /**
   * Format phone number input
   */
  formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value.length <= 3) {
        value = `(${value}`;
      } else if (value.length <= 6) {
        value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
      } else {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
      }
    }
    input.value = value;
  }
  
  /**
   * Handle login
   */
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const button = document.getElementById('loginButton');
    const error = document.getElementById('loginError');
    
    // Show loading state
    this.setLoadingState(button, true);
    error.style.display = 'none';
    
    try {
      const { user, error: authError } = await supabaseService.signIn(email, password);
      
      if (authError) throw authError;
      
      this.handleAuthStateChanged(user);
    } catch (err) {
      error.textContent = err.message || 'Failed to sign in';
      error.style.display = 'block';
    } finally {
      this.setLoadingState(button, false);
    }
  }
  
  /**
   * Handle signup
   */
  async handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const phone = document.getElementById('signupPhone').value;
    const button = document.getElementById('signupButton');
    const error = document.getElementById('signupError');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      error.textContent = 'Passwords do not match';
      error.style.display = 'block';
      return;
    }
    
    // Show loading state
    this.setLoadingState(button, true);
    error.style.display = 'none';
    
    try {
      // Prepare metadata based on user type
      const metadata = {
        user_type: this.userType,
        phone: phone
      };
      
      if (this.userType === 'business') {
        metadata.business_name = document.getElementById('businessName').value;
        metadata.business_type = document.getElementById('businessType').value;
      } else {
        metadata.first_name = document.getElementById('firstName').value;
        metadata.last_name = document.getElementById('lastName').value;
        metadata.invite_code = document.getElementById('inviteCode').value;
      }
      
      const { user, error: authError } = await supabaseService.signUp(email, password, metadata);
      
      if (authError) throw authError;
      
      // Show success message
      this.showSuccessMessage();
    } catch (err) {
      error.textContent = err.message || 'Failed to create account';
      error.style.display = 'block';
    } finally {
      this.setLoadingState(button, false);
    }
  }
  
  /**
   * Show success message after signup
   */
  showSuccessMessage() {
    this.container.innerHTML = `
      <div class="auth-success">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>Account Created Successfully!</h2>
        <p>Please check your email to verify your account.</p>
        <a href="#" class="primary-btn" id="goToLogin">Go to Login</a>
      </div>
    `;
    
    document.getElementById('goToLogin').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderLoginForm();
    });
  }
  
  /**
   * Handle auth state change
   */
  handleAuthStateChanged(user) {
    if (this.options.onAuthStateChanged) {
      this.options.onAuthStateChanged(user);
    }
    
    if (this.options.redirectAfterLogin) {
      window.location.href = this.options.redirectAfterLogin;
    }
  }
  
  /**
   * Set loading state for button
   */
  setLoadingState(button, isLoading) {
    const textSpan = button.querySelector('.btn-text');
    const loaderSpan = button.querySelector('.btn-loader');
    
    if (isLoading) {
      textSpan.style.display = 'none';
      loaderSpan.style.display = 'inline-block';
      button.disabled = true;
    } else {
      textSpan.style.display = 'inline-block';
      loaderSpan.style.display = 'none';
      button.disabled = false;
    }
  }
  
  /**
   * Render reset password form
   */
  renderResetPasswordForm() {
    this.currentView = 'reset-password';
    this.container.innerHTML = `
      <div class="auth-form reset-password-form">
        <div class="form-header">
          <a href="#" class="back-link" id="backToLogin">
            <i class="fas fa-arrow-left"></i> Back to Login
          </a>
          <h2>Reset Password</h2>
        </div>
        
        <p class="form-description">Enter your email and we'll send you instructions to reset your password.</p>
        
        <form id="resetPasswordForm">
          <div class="form-group">
            <label for="resetEmail">Email</label>
            <input type="email" id="resetEmail" required placeholder="Enter your email">
          </div>
          <div class="form-actions">
            <button type="submit" class="primary-btn" id="resetButton">
              <span class="btn-text">Send Reset Link</span>
              <span class="btn-loader" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
            </button>
          </div>
        </form>
        <div class="auth-error" id="resetError" style="display: none;"></div>
        <div class="auth-success" id="resetSuccess" style="display: none;"></div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('backToLogin').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderLoginForm();
    });
    
    document.getElementById('resetPasswordForm').addEventListener('submit', (e) => this.handleResetPassword(e));
  }
  
  /**
   * Handle password reset
   */
  async handleResetPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    const button = document.getElementById('resetButton');
    const error = document.getElementById('resetError');
    const success = document.getElementById('resetSuccess');
    
    // Show loading state
    this.setLoadingState(button, true);
    error.style.display = 'none';
    success.style.display = 'none';
    
    try {
      const { error: resetError } = await supabaseService.resetPassword(email);
      
      if (resetError) throw resetError;
      
      success.textContent = 'Password reset link sent! Check your email.';
      success.style.display = 'block';
      document.getElementById('resetPasswordForm').reset();
    } catch (err) {
      error.textContent = err.message || 'Failed to send reset link';
      error.style.display = 'block';
    } finally {
      this.setLoadingState(button, false);
    }
  }
}

export default AuthComponentRefactored;