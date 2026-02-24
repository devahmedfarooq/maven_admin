// lib/get-token.ts

export function getToken(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('authToken');
    }
    return null;
}

export function getUserData() {
    if (typeof window !== 'undefined') {
        return {
            email: localStorage.getItem('userEmail'),
            id: localStorage.getItem('userId'),
            verified: localStorage.getItem('userVerified') === 'true'
        };
    }
    return null;
}

export function isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
        return !!localStorage.getItem('authToken');
    }
    return false;
}
