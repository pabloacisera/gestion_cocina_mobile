import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/shared/Navbar";
import { ProtectedRoute } from "./components/shared/ProtectedRoute";
import { Report } from "./pages/Report";
import { Shopping } from "./pages/Shopping";
import { Home } from "./pages/Home";
import { Providers } from "./pages/Providers";
import { Product } from "./pages/Product"; 
import { Inventary } from "./pages/Inventary"; 
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import { Profile } from "./pages/Profile";
import { MealsList } from "./pages/MealsList"; // Import the MealsList component
import { MealForm } from "./pages/MealForm"; // Import the MealForm component
import { Login } from "./pages/Login"; 
import { Register } from "./pages/Register"; 

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Navbar /> 
        <Routes>
          <Route path="/" element={ <Navigate to="/home" replace/> } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="/shopping" element={<ProtectedRoute><Shopping /></ProtectedRoute>} />
          <Route path="/providers" element={<ProtectedRoute><Providers /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Product /></ProtectedRoute>} />
          <Route path="/inventary" element={<ProtectedRoute><Inventary /></ProtectedRoute>} />
          <Route path="/meals" element={<ProtectedRoute><MealsList /></ProtectedRoute>} />
          <Route path="/meals/new" element={<ProtectedRoute><MealForm /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
