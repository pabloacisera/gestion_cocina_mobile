import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/shared/Navbar";
import { Report } from "./pages/Report";
import { Shopping } from "./pages/Shopping";
import { Home } from "./pages/Home";
import { Providers } from "./pages/Providers";
import { Product } from "./pages/Product";
import { Inventary } from "./pages/Inventary";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import { Profile } from "./pages/Profile";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <BrowserRouter>
        { /** aqui agregamos navbar y footer */ }
        <Routes>
          <Route path="/" element={ <Navigate to="/home" replace/> } />
          <Route path="/home" element={ <Home /> } />
          <Route path="/report" element={ <Report /> } />
          <Route path="/shopping" element={ <Shopping /> } />

          <Route path="/providers"  element={< Providers />}/>
          <Route path="/products"   element={< Product />}/>
          <Route path="/inventary"  element={< Inventary />}/>
          <Route path="/profile" element={ <Profile /> }/>
        </Routes>
        <Navbar />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
