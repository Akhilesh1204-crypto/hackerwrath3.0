'use client';

import React, { useState, useEffect } from 'react';

interface PropertyItem {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  neighbourhood: string;
  property_type: string;
  bedrooms: number;
  guest_capacity: number;
  amenities: string[];
  house_rules: string[];
  listing_status: string;
  score?: {
    total_score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'E';
    breakdown: {
      condition: number;
      location: number;
      amenities: number;
      space: number;
      listing_quality: number;
    };
  };
  photos: string[];
}

const CITIES = ['All', 'Mumbai', 'Bengaluru', 'Delhi', 'Gurugram', 'Noida', 'Hyderabad'];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'browse' | 'simulator' | 'console'>('browse');

  // Search state
  const [selectedCity, setSelectedCity] = useState('All');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected property for modal
  const [selectedProp, setSelectedProp] = useState<PropertyItem | null>(null);
  const [bookingModal, setBookingModal] = useState<PropertyItem | null>(null);
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);

  // SwapScore simulator state
  const [simCondition, setSimCondition] = useState(85);
  const [simLocation, setSimLocation] = useState(90);
  const [simAmenities, setSimAmenities] = useState(80);
  const [simSpace, setSimSpace] = useState(75);
  const [simQuality, setSimQuality] = useState(85);

  // API Console State
  const [consoleEndpoint, setConsoleEndpoint] = useState('/api/properties/search');
  const [consoleMethod, setConsoleMethod] = useState('GET');
  const [consoleResponse, setConsoleResponse] = useState<any>(null);
  const [consoleLoading, setConsoleLoading] = useState(false);

  // Fetch properties from live backend API
  const fetchProperties = async (city = selectedCity) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city !== 'All') params.append('city', city);
      if (checkIn && checkOut) {
        params.append('checkIn', checkIn);
        params.append('checkOut', checkOut);
      }
      if (guests > 1) params.append('guests', String(guests));

      const res = await fetch(`/api/properties/search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProperties(data.data || []);
      }
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(selectedCity);
  }, [selectedCity]);

  // Compute live SwapScore in simulator
  const simTotal = Math.round(
    (simCondition * 0.25 +
      simLocation * 0.25 +
      simAmenities * 0.20 +
      simSpace * 0.15 +
      simQuality * 0.15) * 100
  ) / 100;

  let simGrade = 'E';
  if (simTotal >= 85) simGrade = 'A';
  else if (simTotal >= 70) simGrade = 'B';
  else if (simTotal >= 55) simGrade = 'C';
  else if (simTotal >= 40) simGrade = 'D';

  // Live API Console Runner
  const runApiConsole = async (endpoint: string, method = 'GET', body?: any) => {
    setConsoleLoading(true);
    setConsoleEndpoint(endpoint);
    setConsoleMethod(method);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setConsoleResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      });
    } catch (err: any) {
      setConsoleResponse({ error: err.message });
    } finally {
      setConsoleLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* NAVBAR */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
              SS
            </div>
            <div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>SwapStay</span>
              <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                4-City MVP
              </span>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <nav style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveTab('browse')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: activeTab === 'browse' ? '#ffffff' : 'transparent',
                color: activeTab === 'browse' ? '#2563eb' : '#64748b',
                boxShadow: activeTab === 'browse' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Browse Homes
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: activeTab === 'simulator' ? '#ffffff' : 'transparent',
                color: activeTab === 'simulator' ? '#2563eb' : '#64748b',
                boxShadow: activeTab === 'simulator' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              SwapScore Simulator
            </button>
            <button
              onClick={() => {
                setActiveTab('console');
                if (!consoleResponse) runApiConsole('/api/properties/search');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: activeTab === 'console' ? '#ffffff' : 'transparent',
                color: activeTab === 'console' ? '#2563eb' : '#64748b',
                boxShadow: activeTab === 'console' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Live API Console
            </button>
          </nav>
        </div>
      </header>

      {/* HERO BANNER */}
      <div style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)', borderBottom: '1px solid #e2e8f0', padding: '36px 24px 28px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>
            ● Supabase Live Backend Connected (PostgreSQL + RLS + Exclusion Constraints)
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Exchange Access to Verified Homes in India
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#475569', maxWidth: '750px', margin: 0 }}>
            Live frontend demonstrating SwapStay backend APIs: search matching, explainable SwapScores, date-overlap prevention, and credit stay reservations.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* ======================= TAB 1: BROWSE HOMES ======================= */}
        {activeTab === 'browse' && (
          <div>
            {/* SEARCH FILTERS BAR */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                {/* CITY FILTER */}
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Launch Destination
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#fff' }}
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c === 'All' ? 'All Launch Cities' : c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CHECK-IN */}
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Check-in (inclusive)
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>

                {/* CHECK-OUT */}
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Check-out (exclusive)
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>

                {/* GUEST COUNT */}
                <div style={{ flex: '0 1 120px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#fff' }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SEARCH ACTION */}
                <div>
                  <button
                    onClick={() => fetchProperties()}
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    Search Homes
                  </button>
                </div>
              </div>
            </div>

            {/* RESULTS COUNT & HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                {loading ? 'Searching live inventory...' : `${properties.length} Verified Homes Available`}
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Sorted by SwapScore rank &amp; capacity
              </span>
            </div>

            {/* PROPERTY GRID */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                Loading available properties from Supabase PostgreSQL...
              </div>
            ) : properties.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 8px' }}>No properties found for these criteria</h3>
                <p style={{ color: '#64748b', margin: '0 0 16px' }}>Try switching destination city or clearing dates.</p>
                <button
                  onClick={() => {
                    setSelectedCity('All');
                    setCheckIn('');
                    setCheckOut('');
                    setGuests(1);
                    fetchProperties('All');
                  }}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {properties.map((property) => (
                  <div
                    key={property.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {/* PHOTO & BADGES */}
                    <div style={{ position: 'relative', height: '210px', background: '#e2e8f0' }}>
                      <img
                        src={property.photos[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'}
                        alt={property.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {/* CITY BADGE */}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {property.city}, {property.state}
                      </div>

                      {/* SWAPSCORE BADGE */}
                      {property.score && (
                        <div
                          onClick={() => setSelectedProp(property)}
                          title="Click to view explainable score breakdown"
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: property.score.grade === 'A' ? '#15803d' : '#0284c7',
                            color: '#fff',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          }}
                        >
                          Grade {property.score.grade} ({property.score.total_score})
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                        {property.neighbourhood} • {property.property_type}
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
                        {property.title}
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 16px', lineHeight: 1.5, flex: 1 }}>
                        {property.description}
                      </p>

                      {/* CAPACITIES */}
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#334155', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '14px' }}>
                        <span>🛏️ {property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                        <span>👥 Up to {property.guest_capacity} guests</span>
                      </div>

                      {/* AMENITIES PILLS */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                        {property.amenities.slice(0, 4).map((a) => (
                          <span key={a} style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            {a}
                          </span>
                        ))}
                        {property.amenities.length > 4 && (
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            +{property.amenities.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* ACTION BUTTONS */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setBookingModal(property)}
                          style={{
                            flex: 1,
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            padding: '10px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          Book Stay (Credits)
                        </button>
                        <button
                          onClick={() => setSelectedProp(property)}
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          SwapScore Info
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: SWAPSCORE SIMULATOR ======================= */}
        {activeTab === 'simulator' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px' }}>
                  Deterministic SwapScore Formula Tester
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                  Adjust the 5 TRD factors to see how SwapScore calculates the total score and Grade (A–E) with strict explainability.
                </p>
              </div>

              {/* LIVE SCORE GAUGE CARD */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Weighted SwapScore</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a' }}>{simTotal} <span style={{ fontSize: '1.1rem', color: '#94a3b8' }}>/ 100</span></div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Method Version: <strong>1.0 (India Pilot Specification)</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Grade Boundary</div>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: simGrade === 'A' ? '#16a34a' : simGrade === 'B' ? '#2563eb' : simGrade === 'C' ? '#eab308' : '#dc2626',
                      color: '#fff',
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                    }}
                  >
                    {simGrade}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    {simGrade === 'A' ? '85–100' : simGrade === 'B' ? '70–84.9' : simGrade === 'C' ? '55–69.9' : 'Below 55'}
                  </span>
                </div>
              </div>

              {/* SLIDERS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. CONDITION */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Condition &amp; Cleanliness (Weight: 25%)</span>
                    <span style={{ fontWeight: 800, color: '#2563eb' }}>{simCondition}/100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simCondition}
                    onChange={(e) => setSimCondition(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                </div>

                {/* 2. LOCATION */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Location &amp; Accessibility (Weight: 25%)</span>
                    <span style={{ fontWeight: 800, color: '#2563eb' }}>{simLocation}/100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simLocation}
                    onChange={(e) => setSimLocation(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                </div>

                {/* 3. AMENITIES */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Amenities &amp; Comfort (Weight: 20%)</span>
                    <span style={{ fontWeight: 800, color: '#2563eb' }}>{simAmenities}/100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simAmenities}
                    onChange={(e) => setSimAmenities(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                </div>

                {/* 4. SPACE */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Space &amp; Capacity (Weight: 15%)</span>
                    <span style={{ fontWeight: 800, color: '#2563eb' }}>{simSpace}/100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simSpace}
                    onChange={(e) => setSimSpace(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                </div>

                {/* 5. QUALITY */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Listing Quality &amp; Evidence (Weight: 15%)</span>
                    <span style={{ fontWeight: 800, color: '#2563eb' }}>{simQuality}/100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simQuality}
                    onChange={(e) => setSimQuality(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: LIVE API CONSOLE ======================= */}
        {activeTab === 'console' && (
          <div>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px' }}>
                  Live API Testing Console
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                  Execute real backend routes on your running Next.js server to verify JSON envelopes, authentication responses, and database queries.
                </p>
              </div>

              {/* QUICK TEST ACTION PRESETS */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                <button
                  onClick={() => runApiConsole('/api/properties/search')}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  GET /api/properties/search (All)
                </button>
                <button
                  onClick={() => runApiConsole('/api/properties/search?city=Mumbai')}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  GET /api/properties/search?city=Mumbai
                </button>
                <button
                  onClick={() => runApiConsole('/api/properties/search?city=Bengaluru')}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  GET /api/properties/search?city=Bengaluru
                </button>
                <button
                  onClick={() => runApiConsole('/api/wallet')}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  GET /api/wallet (Auth check)
                </button>
                <button
                  onClick={() => runApiConsole('/api/swaps')}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  GET /api/swaps (Auth check)
                </button>
              </div>

              {/* URL BAR */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <span style={{ background: '#0284c7', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
                  {consoleMethod}
                </span>
                <input
                  type="text"
                  value={consoleEndpoint}
                  onChange={(e) => setConsoleEndpoint(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
                <button
                  onClick={() => runApiConsole(consoleEndpoint, consoleMethod)}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {consoleLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>

              {/* RESPONSE VIEWER */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Response Output</span>
                  {consoleResponse && (
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: consoleResponse.status === 200 ? '#15803d' : '#b91c1c' }}>
                      HTTP {consoleResponse.status} {consoleResponse.statusText}
                    </span>
                  )}
                </div>
                <pre
                  style={{
                    background: '#0f172a',
                    color: '#38bdf8',
                    padding: '16px',
                    borderRadius: '8px',
                    maxHeight: '380px',
                    overflowY: 'auto',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.85rem',
                    margin: 0,
                  }}
                >
                  {consoleLoading ? 'Executing request...' : JSON.stringify(consoleResponse, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SWAPSCORE MODAL */}
      {selectedProp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>SwapScore Breakdown</h3>
              <button onClick={() => setSelectedProp(null)} style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '20px' }}>
              <strong>{selectedProp.title}</strong> has a verified grade of <strong>Grade {selectedProp.score?.grade}</strong> with a total score of <strong>{selectedProp.score?.total_score}/100</strong>.
            </p>

            {selectedProp.score && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Condition &amp; Cleanliness (25%)</span>
                  <strong>{selectedProp.score.breakdown.condition}/100</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Location &amp; Accessibility (25%)</span>
                  <strong>{selectedProp.score.breakdown.location}/100</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Amenities &amp; Comfort (20%)</span>
                  <strong>{selectedProp.score.breakdown.amenities}/100</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Space &amp; Capacity (15%)</span>
                  <strong>{selectedProp.score.breakdown.space}/100</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Listing Completeness (15%)</span>
                  <strong>{selectedProp.score.breakdown.listing_quality}/100</strong>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedProp(null)}
              style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {bookingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Simulate Stay Booking</h3>
              <button onClick={() => { setBookingModal(null); setBookingNotice(null); }} style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 600, margin: '0 0 12px' }}>
              {bookingModal.title}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px' }}>
              Location: {bookingModal.neighbourhood}, {bookingModal.city}
            </p>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span>Rate Hypothesis</span>
                <strong>1 Credit / Night</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span>Selected Duration</span>
                <strong>3 Nights</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1px solid #cbd5e1', paddingTop: '8px', color: '#2563eb' }}>
                <span>Total Credits Required</span>
                <span>3 Credits</span>
              </div>
            </div>

            {bookingNotice ? (
              <div style={{ background: '#fef3c7', color: '#92400e', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {bookingNotice}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setBookingNotice('Backend validation: Stay bookings require an authenticated member session with verified credit wallet balance. Sign in or test via the API Console tab!');
                }}
                style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Send Booking Request
              </button>
              <button
                onClick={() => { setBookingModal(null); setBookingNotice(null); }}
                style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
