import toast from "react-hot-toast";

export const ApiService = {
  // Base URL is relative because ViteExpress serves from the same origin.
  // If a different API URL were needed, it could be configured via environment variables:
  // const BASE_URL = import.meta.env.VITE_API_URL || '';
  
  async get<T = any>(path: string): Promise<T> {
    const response = await fetch(path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async post<T = any>(path: string, body: unknown): Promise<T> {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      // Attempt to show specific validation errors if available
      if (errorData.errors) {
        Object.values(errorData.errors).forEach((fieldErrors: any) => {
          fieldErrors.forEach((err: string) => toast.error(err));
        });
      } else {
        toast.error(errorMessage);
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async put<T = any>(path: string, body: unknown): Promise<T> {
    const response = await fetch(path, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
       if (errorData.errors) {
        Object.values(errorData.errors).forEach((fieldErrors: any) => {
          fieldErrors.forEach((err: string) => toast.error(err));
        });
      } else {
        toast.error(errorMessage);
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async delete<T = any>(path: string): Promise<T> {
    const response = await fetch(path, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  },
};
