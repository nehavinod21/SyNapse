import React, { useState, useEffect } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const SessionHistoryPanel = ({ childId, childName }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportContent, setReportContent] = useState(null);
  const [reportLanguage, setReportLanguage] = useState('en');

  const designTokens = {
    colorBg: '#f7f6f2',
    colorSurface: '#ffffff',
    colorBorder: '#e2e0db',
    colorText: '#1a1a1a',
    colorTextMuted: '#6b6b6b',
    colorPrimary: '#01696f',
    colorPrimaryHover: '#0c4e54',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorSuccessBg: '#dcfce7',
    colorWarningBg: '#fef3c7',
    colorErrorBg: '#fee2e2',
  };

  useEffect(() => {
    fetchSessionHistory();
  }, [childId]);

  const fetchSessionHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/reports/child/${childId}/history`);
      setSessions(response.data.sessions || []);
    } catch (err) {
      toast.error('Failed to fetch session history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (sessionId, language = 'en') => {
    setGeneratingReport(true);
    try {
      const response = await api.post(
        `/api/reports/session/${sessionId}/generate-report`,
        { language }
      );
      setReportContent(response.data);
      setReportLanguage(language);
      toast.success('Report generated successfully');
    } catch (err) {
      toast.error('Failed to generate report');
      console.error(err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadPDF = async (sessionId, language = 'en') => {
    try {
      const response = await api.get(
        `/api/reports/session/${sessionId}/generate-pdf?language=${language}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${childName}_${language}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error('Failed to download PDF');
      console.error(err);
    }
  };

  const getEmotionColor = (emotion) => {
    switch (emotion) {
      case 'happy':
        return designTokens.colorSuccess;
      case 'sad':
        return '#3b82f6';
      case 'angry':
        return designTokens.colorError;
      case 'fear':
        return '#8b5cf6';
      default:
        return designTokens.colorTextMuted;
    }
  };

  return (
    <div style={{
      border: `1px solid ${designTokens.colorBorder}`,
      borderRadius: '12px',
      padding: '20px',
      background: designTokens.colorSurface,
      marginTop: '20px',
    }}>
      <h2 style={{
        fontSize: '1rem',
        fontWeight: '700',
        color: designTokens.colorText,
        marginBottom: '16px',
        margin: 0,
      }}>📋 Session History: {childName}</h2>

      {loading ? (
        <p style={{ color: designTokens.colorTextMuted }}>Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p style={{ color: designTokens.colorTextMuted }}>No sessions recorded yet</p>
      ) : (
        <>
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            marginBottom: '16px',
          }}>
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: selectedSession?.id === session.id 
                    ? '#f0f9fa'
                    : designTokens.colorBg,
                  border: `1px solid ${selectedSession?.id === session.id 
                    ? designTokens.colorPrimary 
                    : designTokens.colorBorder}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f9fa';
                  e.currentTarget.style.borderColor = designTokens.colorPrimary;
                }}
                onMouseLeave={(e) => {
                  if (selectedSession?.id !== session.id) {
                    e.currentTarget.style.background = designTokens.colorBg;
                    e.currentTarget.style.borderColor = designTokens.colorBorder;
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}>
                  <span style={{
                    fontWeight: '600',
                    color: designTokens.colorText,
                    fontSize: '0.875rem',
                  }}>
                    {session.topic}
                  </span>
                  <span
                    style={{
                      background: getEmotionColor(session.dominant_emotion),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {session.dominant_emotion}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: designTokens.colorTextMuted,
                  lineHeight: '1.6',
                }}>
                  <div>📅 {new Date(session.started_at).toLocaleDateString()} {new Date(session.started_at).toLocaleTimeString()}</div>
                  <div>⏱️ {session.duration_minutes.toFixed(1)} min | 💬 {session.total_card_selections} interactions</div>
                </div>
              </div>
            ))}
          </div>

          {selectedSession && (
            <div style={{
              background: designTokens.colorBg,
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px',
            }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: designTokens.colorText,
                marginBottom: '8px',
              }}>
                Selected: {selectedSession.topic}
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => generateReport(selectedSession.id, 'en')}
                  disabled={generatingReport}
                  style={{
                    background: designTokens.colorPrimary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: generatingReport ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => !generatingReport ? e.target.style.background = designTokens.colorPrimaryHover : null}
                  onMouseLeave={(e) => !generatingReport ? e.target.style.background = designTokens.colorPrimary : null}
                >
                  📄 Report (EN)
                </button>
                <button
                  onClick={() => generateReport(selectedSession.id, 'ar')}
                  disabled={generatingReport}
                  style={{
                    background: designTokens.colorPrimary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: generatingReport ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => !generatingReport ? e.target.style.background = designTokens.colorPrimaryHover : null}
                  onMouseLeave={(e) => !generatingReport ? e.target.style.background = designTokens.colorPrimary : null}
                >
                  📄 Report (AR)
                </button>
                <button
                  onClick={() => downloadPDF(selectedSession.id, 'en')}
                  style={{
                    background: designTokens.colorSuccess,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  📥 Download PDF (EN)
                </button>
                <button
                  onClick={() => downloadPDF(selectedSession.id, 'ar')}
                  style={{
                    background: designTokens.colorSuccess,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  📥 Download PDF (AR)
                </button>
              </div>
            </div>
          )}

          {reportContent && (
            <div style={{
              background: '#fafafa',
              border: `1px solid ${designTokens.colorBorder}`,
              borderRadius: '8px',
              padding: '12px',
              maxHeight: '400px',
              overflowY: 'auto',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: designTokens.colorText,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}>
              {reportLanguage === 'ar' ? reportContent.arabic : reportContent.english}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SessionHistoryPanel;
