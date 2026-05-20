import React from 'react';

export const PrivacyPolicy: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="p-8 max-w-md mx-auto bg-white min-h-screen text-gray-900 pb-20">
    <button onClick={onBack} className="mb-6 font-black text-primary-600 uppercase text-[10px] tracking-widest">← Back</button>
    <h1 className="text-2xl font-display font-black mb-4">Privacy Policy</h1>
    <p className="text-xs text-gray-500 mb-6">Last updated: May 20, 2026</p>
    <div className="prose prose-sm text-gray-700 space-y-4">
      <p>This Privacy Policy explains how <strong>Sabelfeld I.</strong> collects, uses, and protects your information when you use the NutriZen mobile application.</p>
      <h3 className="font-bold">1. Data Collection</h3>
      <p>We collect your Email and Name upon registration for cloud sync. We process health metrics (weight, height, age) solely to calculate caloric needs.</p>
      <h3 className="font-bold">2. Data Storage</h3>
      <p>NutriZen is "Offline-First". Data is stored locally. Cloud sync is optional and encrypted via Supabase.</p>
      <h3 className="font-bold">3. Your Rights</h3>
      <p>You have the right to request the deletion of your account. You can wipe all data directly from the Profile Dashboard.</p>
      <h3 className="font-bold">4. Contact</h3>
      <p>Questions? Contact us at <strong>sabelfeld.i@icloud.com</strong></p>
    </div>
  </div>
);