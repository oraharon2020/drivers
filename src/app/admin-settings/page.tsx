'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useLoader } from '@/components/ui/Loader';
import { getAllStatuses } from '@/utils/api';
import { isAuthenticated, getStatusLabel } from '@/utils/helpers';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { show: showLoader, hide: hideLoader } = useLoader();

  const [bellanoStatuses, setBellanoStatuses] = useState<string[]>([]);
  const [nallaStatuses, setNallaStatuses] = useState<string[]>([]);
  const [bellanoSearch, setBellanoSearch] = useState('');
  const [nallaSearch, setNallaSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadStatuses();
  }, [router]);

  const loadStatuses = async () => {
    try {
      showLoader('טוען סטטוסים...');
      setError('');

      const response = await getAllStatuses();

      if (response.success) {
        setBellanoStatuses(response.bellano || []);
        setNallaStatuses(response.nalla || []);
      } else {
        throw new Error('שגיאה בטעינת הסטטוסים');
      }
    } catch (err) {
      console.error('Error loading statuses:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הסטטוסים');
    } finally {
      hideLoader();
    }
  };

  const filterStatuses = (statuses: string[], search: string) => {
    if (!search) return statuses;
    const searchLower = search.toLowerCase();
    return statuses.filter(
      (status) =>
        status.toLowerCase().includes(searchLower) ||
        getStatusLabel(status).toLowerCase().includes(searchLower)
    );
  };

  const handleSave = () => {
    alert('הגדרות נשמרו בהצלחה');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">ניהול סטטוסים</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bellano Statuses */}
            <div>
              <h2 className="text-lg font-semibold mb-4">סטטוסים בלאנו</h2>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={bellanoSearch}
                    onChange={(e) => setBellanoSearch(e.target.value)}
                    className="w-full p-3 pr-10 border rounded-lg mb-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="חיפוש סטטוסים..."
                  />
                  <svg
                    className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <select
                  multiple
                  className="w-full p-2 border rounded-lg min-h-[200px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {filterStatuses(bellanoStatuses, bellanoSearch).map((status) => (
                    <option key={status} value={status} selected>
                      {getStatusLabel(status)} ({status})
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  <label className="block text-sm text-gray-600">
                    לחץ על Ctrl (או Command במק) כדי לבחור מספר סטטוסים
                  </label>
                </div>
              </div>
            </div>

            {/* Nalla Statuses */}
            <div>
              <h2 className="text-lg font-semibold mb-4">סטטוסים נלה</h2>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={nallaSearch}
                    onChange={(e) => setNallaSearch(e.target.value)}
                    className="w-full p-3 pr-10 border rounded-lg mb-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="חיפוש סטטוסים..."
                  />
                  <svg
                    className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <select
                  multiple
                  className="w-full p-2 border rounded-lg min-h-[200px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {filterStatuses(nallaStatuses, nallaSearch).map((status) => (
                    <option key={status} value={status} selected>
                      {getStatusLabel(status)} ({status})
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  <label className="block text-sm text-gray-600">
                    לחץ על Ctrl (או Command במק) כדי לבחור מספר סטטוסים
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              שמור שינויים
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
              הוסף סטטוס חדש
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
