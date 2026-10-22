'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CITY_STATE_MAP, LAUNCH_CITIES } from '@/lib/validations/property';
import { Home, ShieldCheck, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';

export default function NewPropertyPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<'Mumbai' | 'Bengaluru' | 'Delhi' | 'Gurugram' | 'Noida' | 'Hyderabad'>('Mumbai');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [propertyType, setPropertyType] = useState('apartment');
  const [bedrooms, setBedrooms] = useState(2);
  const [guestCapacity, setGuestCapacity] = useState(3);
  const [exactAddress, setExactAddress] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['WiFi', 'Air Conditioning', 'Kitchen']);
  const [selectedRules, setSelectedRules] = useState<string[]>(['No smoking inside', 'Quiet hours after 10 PM']);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const availableAmenities = [
    'WiFi',
    'Air Conditioning',
    'Kitchen',
    'Elevator',
    'Work Desk',
    'Power Backup',
    'Washing Machine',
    'Gym',
    'Swimming Pool',
    'Security 24/7',
  ];

  const availableRules = [
    'No smoking inside',
    'Quiet hours after 10 PM',
    'No pets',
    'ID verification required at gate',
    'Conserve water and power',
  ];

  const toggleAmenity = (item: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const toggleRule = (item: string) => {
    setSelectedRules((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentUser) {
      setErrorMsg('You must select or sign into an account to list a property.');
      return;
    }

    if (title.trim().length < 5) {
      setErrorMsg('Title must be at least 5 characters.');
      return;
    }

    if (description.trim().length < 20) {
      setErrorMsg('Description must be at least 20 characters.');
      return;
    }

    if (!neighbourhood.trim()) {
      setErrorMsg('Neighbourhood is required.');
      return;
    }

    if (exactAddress.trim().length < 10) {
      setErrorMsg('Exact address is required for verification (minimum 10 characters).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          title,
          description,
          city,
          state: CITY_STATE_MAP[city],
          neighbourhood,
          property_type: propertyType,
          bedrooms: Number(bedrooms),
          guest_capacity: Number(guestCapacity),
          amenities: selectedAmenities,
          house_rules: selectedRules,
          exact_address: exactAddress,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Your home listing has been created and submitted for review!');
        setTimeout(() => {
          router.push(`/properties/${data.data.id}`);
        }, 1500);
      } else {
        setErrorMsg(data.error?.message || 'Failed to create listing.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10">
        <div className="border-b border-slate-100 pb-6 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Four-City India Launch Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            List Your Home for Exchange
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Offer your home to verified members across Mumbai, Bengaluru, Delhi NCR, and Hyderabad.
            Exact addresses remain confidential until booking confirmation.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TITLE */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Listing Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spacious 2BHK with Balcony near Indiranagar Metro"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Description *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your home, neighborhood ambiance, nearby transit, and amenities..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
              required
            />
          </div>

          {/* LOCATION GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Launch City *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
              >
                {LAUNCH_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c} ({CITY_STATE_MAP[c]})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                State: <strong>{CITY_STATE_MAP[city]}</strong> (stored explicitly as per TRD specification)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Neighbourhood / Locality *
              </label>
              <input
                type="text"
                value={neighbourhood}
                onChange={(e) => setNeighbourhood(e.target.value)}
                placeholder="e.g. Bandra West, Koramangala, Sector 25"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                required
              />
            </div>
          </div>

          {/* TYPE & CAPACITY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
              >
                <option value="apartment">Apartment</option>
                <option value="studio">Studio Flat</option>
                <option value="independent_house">Independent House</option>
                <option value="villa">Villa</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Bedrooms
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Max Guests
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={guestCapacity}
                onChange={(e) => setGuestCapacity(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* AMENITIES */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Amenities & Comfort (Boosts SwapScore)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableAmenities.map((amenity) => (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    selectedAmenities.includes(amenity)
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {selectedAmenities.includes(amenity) ? '✓ ' : '+ '}
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* HOUSE RULES */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              House Rules
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableRules.map((rule) => (
                <button
                  type="button"
                  key={rule}
                  onClick={() => toggleRule(rule)}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    selectedRules.includes(rule)
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {selectedRules.includes(rule) ? '✓ ' : '+ '}
                  {rule}
                </button>
              ))}
            </div>
          </div>

          {/* EXACT ADDRESS (PRIVATE) */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Private Exact Address (Protected by Server RLS)
            </div>
            <p className="text-xs text-amber-800 mb-3">
              Never shown publicly. The exact address is only disclosed to a confirmed guest after a mutual exchange agreement is sealed.
            </p>
            <input
              type="text"
              value={exactAddress}
              onChange={(e) => setExactAddress(e.target.value)}
              placeholder="Flat/Door number, Building/Society name, Street, Pincode"
              className="w-full px-4 py-3 rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm"
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'Submitting...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
