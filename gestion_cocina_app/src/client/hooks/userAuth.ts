import { useAuth } from "../context/AuthContext";

export const userAuth = () => {
  return useAuth();
};
