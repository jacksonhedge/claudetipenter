/**
 * Role Selection Modal Component
 * Shows a modal to select user role after successful Google authentication
 */

import { 
  showSuccessNotification, 
  showErrorNotification,
  firebase,
  db,
  getFirebaseFirestore
} from '../utils/importResolver.js';

/**
 * Show a modal allowing the user to select their role
 * @param {Object} user - The Firebase user object
 * @param {Function} onComplete - Optional callback when complete
 */
export function showRoleSelectionModal(user, onComplete) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'role-selection-modal';
  modal.innerHTML = `
    <div class="role-selection-content">
      <h2>Select Your Role</h2>
      <p>Please select your role to complete sign-up:</p>
      <div class="role-buttons">
        <button type="button" class="role-btn" data-role="bartender">
          <i class="fas fa-glass-martini-alt"></i>
          <span>Bartender</span>
        </button>
        <button type="button" class="role-btn" data-role="manager">
          <i class="fas fa-briefcase"></i>
          <span>Business</span>
        </button>
      </div>
      <button type="button" class="continue-btn">Continue</button>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .role-selection-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    .role-selection-content {
      background-color: white;
      padding: 2rem;
      border-radius: 10px;
      max-width: 500px;
      width: 90%;
      text-align: center;
    }
    .role-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin: 1.5rem 0;
    }
    .role-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 130px;
      height: 110px;
      padding: 1.2rem;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      background-color: #fff;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .role-btn.active {
      border-color: #F76E11;
      background: linear-gradient(135deg, #FFF7E6, #FFF2D8);
      box-shadow: 0 5px 15px rgba(247, 110, 17, 0.15);
    }
    .role-btn i {
      font-size: 2.2rem;
      margin-bottom: 0.7rem;
      color: #7f8c8d;
      transition: color 0.3s ease;
    }
    .role-btn.active i {
      color: #F76E11;
    }
    .continue-btn {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #FF8C42, #F76E11, #FF5757);
      color: white;
      border: none;
      border-radius: 50px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .continue-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(247, 110, 17, 0.3);
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(modal);
  
  // Add event listeners
  const roleButtons = modal.querySelectorAll('.role-btn');
  let selectedRole = 'bartender'; // Default role
  
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      roleButtons.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      // Update selected role
      selectedRole = btn.getAttribute('data-role');
    });
  });
  
  // Set first button as active by default
  roleButtons[0].classList.add('active');
  
  // Continue button creates user profile and redirects
  const continueBtn = modal.querySelector('.continue-btn');
  continueBtn.addEventListener('click', async () => {
    try {
      // Check if we're using v9 or v8 Firebase API
      const isV9API = typeof firebase.firestore !== 'function';
      
      if (isV9API) {
        // Using modular v9 API
        const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
        const { db } = await import('../firebase-config.js');
        
        await setDoc(doc(db, 'users', user.uid), {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: selectedRole,
          createdAt: serverTimestamp()
        });
      } else {
        // Using namespaced v8 API
        await firebase.firestore().collection('users').doc(user.uid).set({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: selectedRole,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Show success notification
      showSuccessNotification('Account created successfully!');
      
      // Remove modal
      document.body.removeChild(modal);
      document.head.removeChild(style);
      
      // Call onComplete if provided
      if (typeof onComplete === 'function') {
        onComplete(selectedRole);
      } else {
        // Default behavior - redirect to home page
        setTimeout(() => {
          if (selectedRole === 'manager') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'home.html';
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating user document:", error);
      showErrorNotification('Failed to create user profile');
    }
  });
  
  return {
    close: () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    }
  };
}
