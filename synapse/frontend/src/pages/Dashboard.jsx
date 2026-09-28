import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SessionHistoryPanel from '../components/SessionHistoryPanel';

const Dashboard = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('recent');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedChild, setExpandedChild] = useState(null);

  const designTokens = {
    colorBg: '#f7f6f2',
    colorSurface: '#ffffff',
    colorSurface2: '#f9f8f5',
    colorBorder: '#e2e0db',
    colorDivider: '#dcd9d5',
    colorText: '#1a1a1a',
    colorTextMuted: '#6b6b6b',
    colorTextFaint: '#9ca3af',
    colorPrimary: '#01696f',
    colorPrimaryHover: '#0c4e54',
    colorPrimaryLight: '#e8f4f5',
    colorPrimaryBg: '#cedcd8',
    colorSuccess: '#16a34a',
    colorSuccessBg: '#dcfce7',
    colorSuccessBorder: '#bbf7d0',
    colorWarning: '#d97706',
    colorWarningBg: '#fef3c7',
    colorWarningBorder: '#fde68a',
    colorError: '#dc2626',
    colorErrorBg: '#fee2e2',
    colorErrorBorder: '#fecaca',
  };

  const children = [
    {
      id: 1,
      name: 'Alex',
      age: 8,
      status: 'ready',
      statusLabel: 'Ready for Communication',
      lastSession: 'Today 10:30 AM (5 turns)',
      baseline: 'Mean=78.3, StdDev=6.1',
      recommendation: null,
    },
    {
      id: 2,
      name: 'Jordan',
      age: 7,
      status: 'support',
      statusLabel: 'Needs Support (Signal: 0.68)',
      lastSession: 'Yesterday 9:15 AM (8 turns)',
      baseline: 'Mean=82.1, StdDev=7.4',
      recommendation: 'Shorter sessions',
    },
    {
      id: 3,
      name: 'Sam',
      age: 9,
      status: 'urgent',
      statusLabel: 'Needs Immediate Support',
      lastSession: '2 days ago 11:00 AM (3 turns)',
      baseline: 'Mean=88.7, StdDev=12.2',
      recommendation: 'High baseline variability',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return designTokens.colorSuccess;
      case 'support':
        return designTokens.colorWarning;
      case 'urgent':
        return designTokens.colorError;
      default:
        return designTokens.colorTextMuted;
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'ready':
        return designTokens.colorSuccessBg;
      case 'support':
        return designTokens.colorWarningBg;
      case 'urgent':
        return designTokens.colorErrorBg;
      default:
        return designTokens.colorSurface2;
    }
  };

  const filteredChildren = children.filter((child) => {
    if (filterStatus === 'all') return true;
    return child.status === filterStatus;
  });

  const sortedChildren = [...filteredChildren].sort((a, b) => {
    if (sortBy === 'recent') return 0; // Keep original order
    if (sortBy === 'status') {
      const statusOrder = { ready: 0, support: 1, urgent: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    if (sortBy === 'progress') return a.age - b.age; // Just a placeholder
    return 0;
  });

  const ChildCard = ({ child }) => (
    <div
      style={{
        border: `1px solid ${designTokens.colorBorder}`,
        borderLeft: `4px solid ${getStatusColor(child.status)}`,
        borderRadius: '12px',
        padding: '18px 20px',
        marginBottom: '12px',
        background: designTokens.colorSurface,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: getStatusColor(child.status),
          }}
        ></div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: designTokens.colorText, margin: 0 }}>
          {child.name} ({child.age} years)
        </h3>
        <div
          style={{
            display: 'inline-flex',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: getStatusBgColor(child.status),
            color: getStatusColor(child.status),
          }}
        >
          Status: {child.statusLabel}
        </div>
      </div>

      {/* Meta Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginTop: '8px' }}>
        <div>
          <p style={{
            fontSize: '0.875rem',
            color: designTokens.colorTextMuted,
            margin: '4px 0',
            lineHeight: '1.8',
          }}>
            Last Session: {child.lastSession}
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: designTokens.colorTextMuted,
            margin: '4px 0',
            lineHeight: '1.8',
            fontFamily: 'monospace',
          }}>
            Baseline: <span style={{ fontWeight: 'bold' }}>{child.baseline}</span>
          </p>
        </div>
        {child.recommendation && (
          <div style={{
            color: designTokens.colorWarning,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            ℹ️ Recommendation: {child.recommendation}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <button
          onClick={() => navigate('/aac-session')}
          style={{
            background: designTokens.colorPrimary,
            color: 'white',
            padding: '9px 18px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 180ms ease',
          }}
          onMouseEnter={(e) => e.target.style.background = designTokens.colorPrimaryHover}
          onMouseLeave={(e) => e.target.style.background = designTokens.colorPrimary}
        >
          ▶ START SESSION
        </button>
        <button
          onClick={() => setExpandedChild(expandedChild === child.id ? null : child.id)}
          style={{
            background: designTokens.colorSurface,
            border: `1px solid ${designTokens.colorBorder}`,
            color: designTokens.colorText,
            padding: '9px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 180ms ease',
          }}
          onMouseEnter={(e) => e.target.style.background = designTokens.colorSurface2}
          onMouseLeave={(e) => e.target.style.background = designTokens.colorSurface}
        >
          📜 {expandedChild === child.id ? 'HIDE' : 'SHOW'} HISTORY
        </button>
        <button
          style={{
            background: designTokens.colorSurface,
            border: `1px solid ${designTokens.colorBorder}`,
            color: designTokens.colorText,
            padding: '9px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 180ms ease',
          }}
          onMouseEnter={(e) => e.target.style.background = designTokens.colorSurface2}
          onMouseLeave={(e) => e.target.style.background = designTokens.colorSurface}
        >
          👤 VIEW PROFILE
        </button>
        <button
          style={{
            background: designTokens.colorSurface,
            border: `1px solid ${designTokens.colorBorder}`,
            color: designTokens.colorText,
            padding: '9px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 180ms ease',
          }}
          onMouseEnter={(e) => e.target.style.background = designTokens.colorSurface2}
          onMouseLeave={(e) => e.target.style.background = designTokens.colorSurface}
        >
          📄 VIEW REPORT
        </button>
      </div>

      {/* Session History Panel */}
      {expandedChild === child.id && (
        <SessionHistoryPanel childId={child.id} childName={child.name} />
      )}
    </div>
  );

  return (
    <div style={{ background: designTokens.colorBg, minHeight: '100vh' }}>
      <style>{`
        :root {
          --color-text: ${designTokens.colorText};
          --color-text-muted: ${designTokens.colorTextMuted};
          --color-border: ${designTokens.colorBorder};
          --color-primary: ${designTokens.colorPrimary};
        }
      `}</style>

      <Navbar />

      {/* Main Content Area */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Dashboard Header Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}>
          <div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: designTokens.colorText,
              margin: '0 0 8px 0',
            }}>My Children</h1>
            <p style={{
              fontSize: '0.875rem',
              color: designTokens.colorTextMuted,
              margin: 0,
            }}>
              Session Active: <span style={{ color: designTokens.colorError, fontWeight: '600' }}>NO</span> Time: {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            style={{
              background: designTokens.colorPrimaryLight,
              color: designTokens.colorPrimary,
              border: `1px solid ${designTokens.colorPrimaryBg}`,
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = designTokens.colorPrimaryBg;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = designTokens.colorPrimaryLight;
            }}
          >
            👁️ Try Emotion Detection
          </button>
        </div>

        {/* Filter & Sort Bar */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${designTokens.colorDivider}`,
        }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              border: `1px solid ${designTokens.colorBorder}`,
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.875rem',
              background: designTokens.colorSurface,
              color: designTokens.colorText,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Status</option>
            <option value="ready">Ready for Communication</option>
            <option value="support">Needs Support</option>
            <option value="urgent">Needs Immediate Support</option>
          </select>

          <span style={{ color: designTokens.colorTextMuted }}>|</span>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setSortBy('recent')}
              style={{
                background: 'none',
                border: 'none',
                color: sortBy === 'recent' ? designTokens.colorPrimary : designTokens.colorTextMuted,
                fontSize: '0.875rem',
                fontWeight: sortBy === 'recent' ? '600' : '400',
                cursor: 'pointer',
              }}
            >
              Sort: By Recent
            </button>
            <span style={{ color: designTokens.colorTextMuted }}>|</span>
            <button
              onClick={() => setSortBy('status')}
              style={{
                background: 'none',
                border: 'none',
                color: sortBy === 'status' ? designTokens.colorPrimary : designTokens.colorTextMuted,
                fontSize: '0.875rem',
                fontWeight: sortBy === 'status' ? '600' : '400',
                cursor: 'pointer',
              }}
            >
              By Status
            </button>
            <span style={{ color: designTokens.colorTextMuted }}>|</span>
            <button
              onClick={() => setSortBy('progress')}
              style={{
                background: 'none',
                border: 'none',
                color: sortBy === 'progress' ? designTokens.colorPrimary : designTokens.colorTextMuted,
                fontSize: '0.875rem',
                fontWeight: sortBy === 'progress' ? '600' : '400',
                cursor: 'pointer',
              }}
            >
              By Progress
            </button>
          </div>
        </div>

        {/* Child Profile Cards */}
        {sortedChildren.map((child) => (
          <ChildCard key={child.id} child={child} />
        ))}

        {/* Class Overview Panel */}
        <div style={{
          border: `1px solid ${designTokens.colorBorder}`,
          borderRadius: '12px',
          padding: '18px 20px',
          background: designTokens.colorSurface,
          marginTop: '8px',
        }}>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: '700',
            color: designTokens.colorText,
            marginBottom: '12px',
            margin: 0,
          }}>🏫 Class Overview:</h2>
          <div style={{
            fontSize: '0.875rem',
            color: designTokens.colorText,
            lineHeight: '2',
            fontFamily: "'Courier New', monospace",
          }}>
            <div>├── Average Engagement: <strong>7.2/10</strong></div>
            <div>├── Sessions This Week: <strong>12</strong></div>
            <div>└── Students Making Progress: <strong>2/3</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
