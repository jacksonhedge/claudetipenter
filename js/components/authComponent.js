/**
 * Authentication Component for TipEnter
 * Provides UI and functionality for user authentication using Supabase
 */

import supabaseService from '../services/supabaseService.js';

class AuthComponent {
  constructor(options = {}) {
    // Default options
    this.options = {
      containerId: 'authContainer',
      onAuthStateChanged: null,
      redirectAfterLogin: null,
      ...options
    };
    
    // State
    this.currentView = 'login'; // 'login', 'signup', 'reset-password'
    this.isLoading = false;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the component
   */
  async init() {
    // Get container
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      console.error(`Auth container with ID "${this.options.containerId}" not found`);
      return;
    }
    
    // Check if user is already logged in
    const user = supabaseService.getCurrentUser();
    if (user) {
      this.handleAuthStateChanged(user);
    } else {
      // Render login form
      this.renderLoginForm();
    }
  }
  
  /**
   * Render login form
   */
  renderLoginForm() {
    this.currentView = 'login';
    this.container.innerHTML = `
      <div class="auth-form login-form">
        <h2>Sign In</h2>
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
    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderResetPasswordForm();
    });
    document.getElementById('signupLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderSignupForm();
    });
  }
  
  /**
   * Render signup form
   */
  renderSignupForm() {
    this.currentView = 'signup';
    this.container.innerHTML = `
      <div class="auth-form signup-form">
        <h2>Create Account</h2>
        <form id="signupForm">
          <div class="form-group">
            <label for="signupEmail">Email</label>
            <input type="email" id="signupEmail" required placeholder="Enter your email">
          </div>
          <div class="form-group">
            <label for="signupPassword">Password</label>
            <input type="password" id="signupPassword" required placeholder="Create a password" minlength="6">
            <small class="form-text">Password must be at least 6 characters</small>
          </div>
          <div class="form-group">
            <label for="signupFullName">Full Name</label>
            <input type="text" id="signupFullName" required placeholder="Enter your full name">
          </div>
          <div class="form-group">
            <label for="signupRole">Role</label>
            <select id="signupRole" required>
              <option value="">Select your role</option>
              <option value="bartender">Bartender</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div class="form-group">
            <label for="signupEstablishment">Establishment Name</label>
            <input type="text" id="signupEstablishment" placeholder="Enter your establishment name">
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
    document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));
    document.getElementById('loginLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderLoginForm();
    });
  }
  
  /**
   * Render reset password form
   */
  renderResetPasswordForm() {
    this.currentView = 'reset-password';
    this.container.innerHTML = `
      <div class="auth-form reset-password-form">
        <h2>Reset Password</h2>
        <p>Enter your email address and we'll send you a link to reset your password.</p>
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
          <div class="form-links">
            <a href="#" id="backToLoginLink">Back to Sign In</a>
          </div>
        </form>
        <div class="auth-message" id="resetMessage" style="display: none;"></div>
        <div class="auth-error" id="resetError" style="display: none;"></div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('resetPasswordForm').addEventListener('submit', (e) => this.handleResetPassword(e));
    document.getElementById('backToLoginLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderLoginForm();
    });
  }
  
  /**
   * Render user profile
   * @param {object} user - User object
   */
  async renderUserProfile(user) {
    // Get user profile
    const { success, profile } = await supabaseService.getUserProfile(user.id);
    
    if (!success || !profile) {
      console.error('Failed to load user profile');
      return;
    }
    
    this.container.innerHTML = `
      <div class="user-profile">
        <h2>Welcome, ${profile.full_name || user.email}</h2>
        <div class="profile-info">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${profile.role || 'N/A'}</p>
          <p><strong>Establishment:</strong> ${profile.establishment || 'N/A'}</p>
          <p><strong>Subscription:</strong> ${profile.subscription_tier || 'Free'}</p>
        </div>
        <div class="profile-actions">
          <button id="signoutButton" class="secondary-btn">Sign Out</button>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('signoutButton').addEventListener('click', () => this.handleSignout());
  }
  
  /**
   * Handle login form submission
   * @param {Event} e - Form submit event
   */
  async handleLogin(e) {
    e.preventDefault();
    
    // Get form data
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Show loading state
    this.setLoading(true, 'loginButton');
    this.hideError('loginError');
    
    // Sign in
    const { success, user, error } = await supabaseService.signIn(email, password);
    
    // Hide loading state
    this.setLoading(false, 'loginButton');
    
    if (success) {
      // Handle successful login
      this.handleAuthStateChanged(user);
      
      // Redirect if needed
      if (this.options.redirectAfterLogin) {
        window.location.href = this.options.redirectAfterLogin;
      }
    } else {
      // Show error
      this.showError('loginError', error || 'Failed to sign in');
    }
  }
  
  /**
   * Handle signup form submission
   * @param {Event} e - Form submit event
   */
  async handleSignup(e) {
    e.preventDefault();
    
    // Get form data
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const fullName = document.getElementById('signupFullName').value;
    const role = document.getElementById('signupRole').value;
    const establishment = document.getElementById('signupEstablishment').value;
    
    // Show loading state
    this.setLoading(true, 'signupButton');
    this.hideError('signupError');
    
    // Sign up
    const { success, user, error } = await supabaseService.signUp(email, password, {
      fullName,
      role,
      establishment,
      subscriptionTier: 'free' // Default to free tier
    });
    
    // Hide loading state
    this.setLoading(false, 'signupButton');
    
    if (success) {
      // Handle successful signup
      this.handleAuthStateChanged(user);
      
      // Redirect if needed
      if (this.options.redirectAfterLogin) {
        window.location.href = this.options.redirectAfterLogin;
      } else {
        // Show success message
        this.container.innerHTML = `
          <div class="auth-success">
            <h2>Account Created!</h2>
            <p>Your account has been created successfully. Check your email for a confirmation link.</p>
            <button id="continueButton" class="primary-btn">Continue</button>
          </div>
        `;
        
        // Add event listener
        document.getElementById('continueButton').addEventListener('click', () => {
          this.renderUserProfile(user);
        });
      }
    } else {
      // Show error
      this.showError('signupError', error || 'Failed to create account');
    }
  }
  
  /**
   * Handle reset password form submission
   * @param {Event} e - Form submit event
   */
  async handleResetPassword(e) {
    e.preventDefault();
    
    // Get form data
    const email = document.getElementById('resetEmail').value;
    
    // Show loading state
    this.setLoading(true, 'resetButton');
    this.hideError('resetError');
    
    // Reset password
    const { success, error } = await supabaseService.resetPassword(email);
    
    // Hide loading state
    this.setLoading(false, 'resetButton');
    
    if (success) {
      // Show success message
      document.getElementById('resetMessage').textContent = 'Password reset link sent to your email';
      document.getElementById('resetMessage').style.display = 'block';
      document.getElementById('resetPasswordForm').reset();
    } else {
      // Show error
      this.showError('resetError', error || 'Failed to send reset link');
    }
  }
  
  /**
   * Handle signout
   */
  async handleSignout() {
    // Sign out
    const { success } = await supabaseService.signOut();
    
    if (success) {
      // Render login form
      this.renderLoginForm();
      
      // Call auth state changed callback
      this.handleAuthStateChanged(null);
    }
  }
  
  /**
   * Handle auth state changed
   * @param {object|null} user - User object or null if signed out
   */
  handleAuthStateChanged(user) {
    // Call callback if provided
    if (typeof this.options.onAuthStateChanged === 'function') {
      this.options.onAuthStateChanged(user);
    }
    
    // Update UI based on auth state
    if (user) {
      this.renderUserProfile(user);
    } else {
      this.renderLoginForm();
    }
    
    // Dispatch event
    const event = new CustomEvent('authStateChanged', { detail: { user } });
    document.dispatchEvent(event);
  }
  
  /**
   * Set loading state
   * @param {boolean} isLoading - Whether loading or not
   * @param {string} buttonId - Button ID
   */
  setLoading(isLoading, buttonId) {
    this.isLoading = isLoading;
    
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    if (isLoading) {
      button.disabled = true;
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-block';
    } else {
      button.disabled = false;
      btnText.style.display = 'inline-block';
      btnLoader.style.display = 'none';
    }
  }
  
  /**
   * Show error message
   * @param {string} elementId - Error element ID
   * @param {string} message - Error message
   */
  showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (!errorElement) return;
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  /**
   * Hide error message
   * @param {string} elementId - Error element ID
   */
  hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (!errorElement) return;
    
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

export default AuthComponent;
