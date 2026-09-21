"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Building2, MapPin, User, AtSign, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function OnboardCafe() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dummyPassword, setDummyPassword] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ownerName: '',
    email: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/cafes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setDummyPassword(data.dummyPassword);
        setSuccess(true);
        // We will hold on the success screen so they can read the dummy password
      } else {
        alert('Failed to onboard cafe. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <Link
          href="/platform/dashboard"
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Onboard New Cafe</h2>
          <p className="text-gray-500 mt-1">Register a new cafe partner into the system</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden"
      >
        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Cafe Onboarded!</h3>
            <p className="text-gray-500 mb-6">The cafe has been successfully registered.</p>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 w-full max-w-sm text-left">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Dummy Email Sent (For Testing)</p>
              <p className="text-sm text-blue-900 mb-1"><strong>Email/Username:</strong> {formData.email}</p>
              <p className="text-sm text-blue-900 mb-4"><strong>Password:</strong> <span className="font-mono bg-blue-100 px-1 py-0.5 rounded">{dummyPassword}</span></p>

              <Link
                href="/platform/dashboard"
                className="block w-full py-2.5 bg-blue-600 text-white text-center rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Cafe Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cafe Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                    placeholder="e.g. The Roastery Cafe"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location/Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                    placeholder="e.g. 123 Baker Street, London"
                    required
                  />
                </div>
              </div>

              {/* Owner Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
              </div>

              {/* Section Divider */}
              <div className="md:col-span-2 pt-4 pb-2">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Contact & Login Information</h4>
                <p className="text-xs text-gray-500 mt-1">An email will be sent to this address with a generated password for the cafe owner.</p>
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none bg-blue-50/30"
                    placeholder="e.g. owner@theroastery.com"
                    required
                  />
                </div>
              </div>

            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-3 rounded-xl font-semibold text-white shadow-md transition-all ${loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'
                  }`}
              >
                {loading ? 'Processing...' : 'Register Cafe'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
