'use client';

import { useEffect, useState } from 'react';
import { useUser } from './_context/UserContext';

export default function DebugToken() {
  const { user } = useUser();
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalStorageToken(localStorage.getItem('accessToken'));
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Token</h1>
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">User Context</h2>
        <pre className="whitespace-pre-wrap overflow-auto max-h-60 bg-white p-3 rounded-md">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">LocalStorage Token</h2>
        <pre className="whitespace-pre-wrap overflow-auto max-h-60 bg-white p-3 rounded-md">
          {localStorageToken || 'No token found'}
        </pre>
      </div>
      <div className="mt-4">
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded-md"
          onClick={() => {
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            window.location.reload();
          }}
        >
          Clear Storage & Reload
        </button>
      </div>
    </div>
  );
} 