// src/App.jsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './components/pages/LoginPages';
import RegisterPage from './components/pages/RegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;