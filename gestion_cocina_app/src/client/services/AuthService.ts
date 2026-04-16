export class AuthService {
    static getStoredAuth() {
        const data = localStorage.getItem("auth_user");

        if(!data) return false;

        try {
            return JSON.parse(data);
        } catch (error) {
            console.error(error);
            return false;
        }
    }
}