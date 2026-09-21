"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Building2, MapPin, User, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Cafe {
  id: string;
  name: string;
  location: string;
  ownerName: string;
  username: string;
  password?: string;
  createdAt?: number;
}

export default function platformDashboard() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCafes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cafes');
      const data = await res.json();
      if (data.success) {
        setCafes(data.cafes);
      }
    } catch (error) {
      console.error('Failed to fetch cafes:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCafes();
  }, []);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 mt-1">Overview of all listed cafes</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchCafes}
            className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/platform/onboard"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Onboard Cafe</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p>Loading cafes...</p>
          </div>
        ) : cafes.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">No Cafes Listed</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">There are no cafes registered yet. Click the button above to onboard your first cafe.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-sm text-gray-600">Cafe Name</th>
                  <th className="p-4 font-semibold text-sm text-gray-600">Location</th>
                  <th className="p-4 font-semibold text-sm text-gray-600">Owner</th>
                  <th className="p-4 font-semibold text-sm text-gray-600">Email</th>
                  <th className="p-4 font-semibold text-sm text-gray-600">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cafes.map((cafe, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={cafe.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{cafe.name}</p>
                          <p className="text-xs text-gray-500">ID: {cafe.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                        {cafe.location || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <User className="w-4 h-4 mr-1.5 text-gray-400" />
                        {cafe.ownerName || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
                          {cafe.username}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {cafe.createdAt ? new Date(cafe.createdAt).toLocaleDateString() : 'Unknown'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
