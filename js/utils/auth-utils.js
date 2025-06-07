class AuthUtils {
    static async signInWithEmail(email, password) {
        try {
            const credential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            console.log('✅ User signed in:', credential.user.uid);
            return { success: true, user: credential.user };
        } catch (error) {
            console.error('Email sign-in failed:', error);
            return { success: false, error: error.message };
        }
    }

    static async createAccount(email, password) {
        try {
            const credential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            console.log('✅ Account created:', credential.user.uid);
            return { success: true, user: credential.user };
        } catch (error) {
            console.error('Account creation failed:', error);
            return { success: false, error: error.message };
        }
    }

    static async signInAnonymously() {
        try {
            const credential = await firebaseAuth.signInAnonymously();
            console.log('✅ Anonymous sign-in:', credential.user.uid);
            return { success: true, user: credential.user };
        } catch (error) {
            console.error('Anonymous sign-in failed:', error);
            return { success: false, error: error.message };
        }
    }

    static async signOut() {
        try {
            await firebaseAuth.signOut();
            console.log('✅ User signed out');
            return { success: true };
        } catch (error) {
            console.error('Sign-out failed:', error);
            return { success: false, error: error.message };
        }
    }

    static getCurrentUser() {
        return firebaseAuth ? firebaseAuth.currentUser : null;
    }

    static isSignedIn() {
        return this.getCurrentUser() !== null;
    }

    static isAnonymous() {
        const user = this.getCurrentUser();
        return user && user.isAnonymous;
    }

    static getUserId() {
        const user = this.getCurrentUser();
        return user ? user.uid : null;
    }

    static getUserEmail() {
        const user = this.getCurrentUser();
        return user && !user.isAnonymous ? user.email : null;
    }

    static getUserDisplayName() {
        const user = this.getCurrentUser();
        if (!user) return 'Not signed in';
        if (user.isAnonymous) return 'Anonymous User';
        return user.displayName || user.email || 'User';
    }

    static onAuthStateChanged(callback) {
        if (!firebaseAuth) {
            console.warn('Firebase Auth not initialized');
            return () => {};
        }
        return firebaseAuth.onAuthStateChanged(callback);
    }

    static async linkAnonymousWithEmail(email, password) {
        try {
            const user = this.getCurrentUser();
            if (!user || !user.isAnonymous) {
                throw new Error('Current user is not anonymous');
            }

            const credential = firebase.auth.EmailAuthProvider.credential(email, password);
            const result = await user.linkWithCredential(credential);
            
            console.log('✅ Anonymous account linked with email:', result.user.uid);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Account linking failed:', error);
            return { success: false, error: error.message };
        }
    }

    static async upgradeAnonymousAccount(email, password) {
        // First try to link the account
        const linkResult = await this.linkAnonymousWithEmail(email, password);
        
        if (linkResult.success) {
            return linkResult;
        }

        // If linking failed because account exists, sign in to existing account
        if (linkResult.error && linkResult.error.includes('already in use')) {
            console.log('🔄 Account exists, signing in to existing account');
            
            // Note: In a real app, you'd want to migrate data here
            const signInResult = await this.signInWithEmail(email, password);
            
            if (signInResult.success) {
                ErrorHandler.showNotification(
                    'Signed in to existing account. Note: Anonymous data was not migrated.',
                    'warning',
                    8000
                );
            }
            
            return signInResult;
        }

        return linkResult;
    }

    static createAuthUI() {
        const authContainer = document.createElement('div');
        authContainer.className = 'auth-container';
        authContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #e2e8f0;
            font-size: 0.85rem;
            z-index: 1000;
            max-width: 250px;
        `;

        const updateAuthUI = () => {
            const user = this.getCurrentUser();
            
            if (!user) {
                authContainer.innerHTML = `
                    <div style="color: #64748b;">Not signed in</div>
                    <button id="authSignInBtn" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                        Sign In
                    </button>
                `;
            } else {
                const displayName = this.getUserDisplayName();
                const isAnon = user.isAnonymous;
                
                authContainer.innerHTML = `
                    <div style="color: #374151; font-weight: 500;">${displayName}</div>
                    <div style="color: #64748b; font-size: 0.75rem;">${isAnon ? 'Anonymous' : user.email}</div>
                    ${isAnon ? `
                        <button id="authUpgradeBtn" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-right: 0.25rem;">
                            Create Account
                        </button>
                    ` : ''}
                    <button id="authSignOutBtn" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                        Sign Out
                    </button>
                `;
            }

            // Bind events
            const signInBtn = authContainer.querySelector('#authSignInBtn');
            const signOutBtn = authContainer.querySelector('#authSignOutBtn');
            const upgradeBtn = authContainer.querySelector('#authUpgradeBtn');

            if (signInBtn) {
                signInBtn.onclick = () => this.showSignInModal();
            }

            if (signOutBtn) {
                signOutBtn.onclick = async () => {
                    const result = await this.signOut();
                    if (result.success) {
                        ErrorHandler.showNotification('Signed out successfully', 'info', 3000);
                    }
                };
            }

            if (upgradeBtn) {
                upgradeBtn.onclick = () => this.showUpgradeModal();
            }
        };

        // Listen for auth state changes
        this.onAuthStateChanged(updateAuthUI);
        updateAuthUI();

        return authContainer;
    }

    static showSignInModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 400px; width: 90%;">
                <h2 style="margin-bottom: 1.5rem; color: #1e293b;">Sign In</h2>
                <form id="signInForm">
                    <input type="email" id="signInEmail" placeholder="Email" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px; margin-bottom: 1rem;">
                    <input type="password" id="signInPassword" placeholder="Password" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px; margin-bottom: 1rem;">
                    <div style="display: flex; gap: 1rem;">
                        <button type="button" id="cancelSignIn" style="flex: 1; padding: 0.75rem; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="flex: 1; padding: 0.75rem; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer;">Sign In</button>
                    </div>
                    <div style="text-align: center; margin-top: 1rem;">
                        <button type="button" id="createAccountBtn" style="background: none; border: none; color: #6366f1; cursor: pointer; text-decoration: underline;">Create Account</button>
                    </div>
                </form>
            </div>
        `;

        const closeModal = () => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        };

        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        modal.querySelector('#cancelSignIn').onclick = closeModal;
        
        modal.querySelector('#signInForm').onsubmit = async (e) => {
            e.preventDefault();
            const email = modal.querySelector('#signInEmail').value;
            const password = modal.querySelector('#signInPassword').value;
            
            const result = await this.signInWithEmail(email, password);
            if (result.success) {
                ErrorHandler.showNotification('Signed in successfully', 'success', 3000);
                closeModal();
            } else {
                ErrorHandler.showNotification(result.error, 'error');
            }
        };

        modal.querySelector('#createAccountBtn').onclick = () => {
            closeModal();
            this.showCreateAccountModal();
        };

        document.body.appendChild(modal);
    }

    static showCreateAccountModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 400px; width: 90%;">
                <h2 style="margin-bottom: 1.5rem; color: #1e293b;">Create Account</h2>
                <form id="createAccountForm">
                    <input type="email" id="createEmail" placeholder="Email" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px; margin-bottom: 1rem;">
                    <input type="password" id="createPassword" placeholder="Password (6+ characters)" required minlength="6" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px; margin-bottom: 1rem;">
                    <div style="display: flex; gap: 1rem;">
                        <button type="button" id="cancelCreate" style="flex: 1; padding: 0.75rem; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="flex: 1; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">Create Account</button>
                    </div>
                </form>
            </div>
        `;

        const closeModal = () => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        };

        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        modal.querySelector('#cancelCreate').onclick = closeModal;
        
        modal.querySelector('#createAccountForm').onsubmit = async (e) => {
            e.preventDefault();
            const email = modal.querySelector('#createEmail').value;
            const password = modal.querySelector('#createPassword').value;
            
            const result = await this.createAccount(email, password);
            if (result.success) {
                ErrorHandler.showNotification('Account created successfully', 'success', 3000);
                closeModal();
            } else {
                ErrorHandler.showNotification(result.error, 'error');
            }
        };

        document.body.appendChild(modal);
    }

    static showUpgradeModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 400px; width: 90%;">
                <h2 style="margin-bottom: 1rem; color: #1e293b;">Create Permanent Account</h2>
                <p style="margin-bottom: 1.5rem; color: #64748b; font-size: 0.9rem;">
                    Convert your anonymous account to a permanent account to ensure your data is never lost.
                </p>
                <form id="upgradeForm">
                    <input type="email" id="upgradeEmail" placeholder="Email" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px; margin-bottom: 1rem;">
                    <input type="password" id="upgradePassword" placeholder="Password (6+ characters)" required minlength="6" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 6px; margin-bottom: 1rem;">
                    <div style="display: flex; gap: 1rem;">
                        <button type="button" id="cancelUpgrade" style="flex: 1; padding: 0.75rem; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="flex: 1; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">Upgrade Account</button>
                    </div>
                </form>
            </div>
        `;

        const closeModal = () => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        };

        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        modal.querySelector('#cancelUpgrade').onclick = closeModal;
        
        modal.querySelector('#upgradeForm').onsubmit = async (e) => {
            e.preventDefault();
            const email = modal.querySelector('#upgradeEmail').value;
            const password = modal.querySelector('#upgradePassword').value;
            
            const result = await this.upgradeAnonymousAccount(email, password);
            if (result.success) {
                ErrorHandler.showNotification('Account upgraded successfully', 'success', 3000);
                closeModal();
            } else {
                ErrorHandler.showNotification(result.error, 'error');
            }
        };

        document.body.appendChild(modal);
    }
}

window.AuthUtils = AuthUtils;