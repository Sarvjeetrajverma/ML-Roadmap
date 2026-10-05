let token = localStorage.getItem('auth_token');
let username = localStorage.getItem('auth_username');

export function isAuthenticated() {
    return !!token;
}

export function getToken() {
    return token;
}

export function getUsername() {
    return username;
}

export function logout() {
    token = null;
    username = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    location.reload();
}

export async function login(user, pass) {
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    
    token = data.token;
    username = data.username;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_username', username);
    return data;
}

export async function signup(user, pass) {
    const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    
    token = data.token;
    username = data.username;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_username', username);
    return data;
}

export function createAuthModal() {
    if (document.getElementById('auth-modal')) return; // prevent duplicate modals

    const modalHtml = `
        <div id="auth-modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(5px);">
            <div style="background:var(--surface); padding:2rem; border-radius:12px; border:1px solid var(--border); max-width:400px; width:100%; box-shadow:0 10px 40px var(--shadow); position:relative;">
                <button id="auth-close" style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; color:var(--text); cursor:pointer; font-size:1.2rem;">✖</button>
                <h2 id="auth-title" style="margin-bottom:1.5rem; font-family:'Syne',sans-serif; color:var(--heading);">Create Account</h2>
                <form id="auth-form" style="display:flex; flex-direction:column; gap:1rem;">
                    <input type="text" id="auth-user" placeholder="Username" required style="padding:0.8rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); font-family:inherit;">
                    <input type="password" id="auth-pass" placeholder="Password" required style="padding:0.8rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); font-family:inherit;">
                    <button type="submit" style="padding:0.8rem; border-radius:8px; background:var(--c8); color:#fff; border:none; font-weight:bold; cursor:pointer; font-family:inherit; margin-top:0.5rem;">Continue</button>
                    <p id="auth-error" style="color:var(--c6); font-size:0.8rem; margin:0; min-height:1rem;"></p>
                    <p style="text-align:center; font-size:0.8rem; color:var(--muted); margin-top:0.5rem;">
                        <a href="#" id="auth-toggle" style="color:var(--c8); text-decoration:none;">Already have an account? Sign in</a>
                    </p>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    let isLogin = false; // Default to Sign Up
    const form = document.getElementById('auth-form');
    const toggle = document.getElementById('auth-toggle');
    const title = document.getElementById('auth-title');
    const errorMsg = document.getElementById('auth-error');
    const closeBtn = document.getElementById('auth-close');
    const modal = document.getElementById('auth-modal');
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        title.innerText = isLogin ? 'Sign In' : 'Create Account';
        toggle.innerText = isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in';
        errorMsg.innerText = '';
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('auth-user').value.trim();
        const p = document.getElementById('auth-pass').value.trim();
        errorMsg.innerText = 'Processing...';
        
        try {
            if (isLogin) {
                await login(u, p);
            } else {
                await signup(u, p);
            }
            modal.remove();
            location.reload(); // Reload to initialize user data cleanly
        } catch (err) {
            errorMsg.innerText = err.message;
            if (err.message.includes('Invalid username')) {
                errorMsg.innerText += " (Did you mean to Sign Up?)";
            }
        }
    });
}
