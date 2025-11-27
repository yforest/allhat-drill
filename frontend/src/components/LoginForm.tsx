// src/components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err?.message ?? 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-lg font-medium mb-4">ログイン</h2>
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <label className="block mb-2 text-sm text-gray-600">ユーザー名</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mb-3 p-2 border rounded" />
        <label className="block mb-2 text-sm text-gray-600">パスワード</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-4 p-2 border rounded" />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;