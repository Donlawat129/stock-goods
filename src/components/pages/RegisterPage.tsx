
import { Link } from 'react-router-dom';

const RegisterPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">ลงทะเบียน</h2>
        <form className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700" htmlFor="email">
              อีเมล
            </label>
            <input
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              id="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700" htmlFor="password">
              รหัสผ่าน
            </label>
            <input
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              id="password"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700" htmlFor="confirm-password">
              ยืนยันรหัสผ่าน
            </label>
            <input
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              id="confirm-password"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="submit"
          >
            ลงทะเบียน
          </button>
        </form>
        <p className="text-sm text-center text-gray-600">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/" className="font-semibold text-blue-600 hover:text-blue-700">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;