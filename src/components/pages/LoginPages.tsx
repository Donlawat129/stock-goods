import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../lib/auth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      console.log("Logged in:", user);
      navigate("/dashboard");
    } catch (err: any) {
      alert(err.message);
    }
    try {
  const user = await login(email, password);
  console.log("Logged in:", user);
  navigate("/dashboard");
} catch (err: any) {
  console.error("Login error:", err); // 👈 log แบบเต็ม ๆ
  alert(err.code + " : " + err.message);
}
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">เข้าสู่ระบบ</h2>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email">อีเมล</label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            เข้าสู่ระบบ
          </button>
        </form>
        <p className="text-sm text-center text-gray-600">
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            ลงทะเบียนที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
