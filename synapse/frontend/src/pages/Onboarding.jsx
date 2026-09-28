import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../hooks/useLang';

const Onboarding = () => {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Consent form state
  const [parentName, setParentName] = useState('');
  const [parentSignature, setParentSignature] = useState('');
  const [parentDate, setParentDate] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentSignature, setStudentSignature] = useState('');
  
  // Permissions state
  const [permissions, setPermissions] = useState({
    camera: true,
    microphone: true,
    motion: true,
    speaker: true,
    location: false,
    biometric: true,
  });
  const [processingLocal, setProcessingLocal] = useState(true);
  const [consentCheckboxes, setConsentCheckboxes] = useState({
    facial: true,
    posture: true,
    voice: true,
    communication: true,
    signals: true,
    metrics: true,
  });

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

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCompleteOnboarding = () => {
    navigate('/dashboard');
  };

  const togglePermission = (permission) => {
    setPermissions({ ...permissions, [permission]: !permissions[permission] });
  };

  // Step 1: Privacy Policy
  const PrivacyPolicyStep = () => (
    <div style={{
      maxWidth: '560px',
      margin: '40px auto',
      padding: '0 16px',
    }}>
      <div style={{
        background: designTokens.colorSurface,
        borderRadius: '12px',
        border: `1px solid ${designTokens.colorBorder}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '32px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛡️</div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: designTokens.colorText,
            marginBottom: '4px',
          }}>SyNAPSE Privacy Policy</h1>
          <p style={{
            fontSize: '0.875rem',
            color: designTokens.colorTextMuted,
          }}>Last Updated: December 7, 2025</p>
        </div>

        {/* Protected Banner */}
        <div style={{
          background: designTokens.colorSuccessBg,
          border: `1px solid ${designTokens.colorSuccessBorder}`,
          borderRadius: '8px',
          padding: '12px 16px',
          marginTop: '20px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: designTokens.colorSuccess,
          }}>🔒📋 YOUR DATA IS PROTECTED</p>
        </div>

        {/* Scrollable Content */}
        <div style={{
          maxHeight: '420px',
          overflowY: 'auto',
          paddingRight: '8px',
          marginTop: '20px',
        }}>
          {/* We Collect */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: designTokens.colorText,
              marginBottom: '8px',
            }}>We collect:</h3>
            {['Camera feed (facial expressions only)', 'Motion data (posture & movement)', 'Voice recordings (with permission)', 'Communication selections (AAC cards)', 'Baseline medical signals (encrypted)'].map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                fontSize: '0.875rem',
                color: designTokens.colorText,
                padding: '4px 0',
              }}>
                <span style={{ color: designTokens.colorSuccess, fontWeight: '700' }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* We DO NOT */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: designTokens.colorText,
              marginBottom: '8px',
            }}>We DO NOT:</h3>
            {['Sell data to third parties', 'Share personal identifiers', 'Use facial recognition for anything except emotional state (never identification)', 'Store camera feed (only processed signals)', 'Use cookies for tracking'].map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                fontSize: '0.875rem',
                color: designTokens.colorText,
                padding: '4px 0',
              }}>
                <span style={{ color: designTokens.colorError, fontWeight: '700' }}>✗</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Data Retention */}
          <div style={{
            background: designTokens.colorSurface2,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: designTokens.colorText,
              marginBottom: '8px',
            }}>Data Retention:</h3>
            {['Session data: 2 years (clinical records)', 'Video: 24 hours (automatic delete)', 'Aggregated data: Indefinite (anonymized)'].map((item, idx) => (
              <p key={idx} style={{ fontSize: '0.875rem', color: designTokens.colorTextMuted, margin: '4px 0' }}>• {item}</p>
            ))}
          </div>

          {/* Questions */}
          <p style={{ fontSize: '0.75rem', color: designTokens.colorTextMuted, marginTop: '12px' }}>
            Questions? Email: <a href="mailto:privacy@synapse.edu" style={{ color: designTokens.colorPrimary, textDecoration: 'none', fontWeight: '600' }}>privacy@synapse.edu</a>
          </p>
        </div>

        {/* Footer Buttons */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleNextStep}
            style={{
              width: '100%',
              background: designTokens.colorPrimary,
              color: 'white',
              padding: '14px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.875rem',
              letterSpacing: '0.03em',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 180ms ease',
            }}
            onMouseEnter={(e) => e.target.style.background = designTokens.colorPrimaryHover}
            onMouseLeave={(e) => e.target.style.background = designTokens.colorPrimary}
          >
            I UNDERSTAND - CONTINUE
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              background: 'transparent',
              border: `1px solid ${designTokens.colorBorder}`,
              color: designTokens.colorTextMuted,
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 180ms ease',
            }}
            onMouseEnter={(e) => e.target.style.background = designTokens.colorSurface2}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            Don't agree? EXIT WITHOUT USING
          </button>
        </div>
      </div>
    </div>
  );

  // Step 2: Terms of Service
  const TermsOfServiceStep = () => (
    <div style={{
      maxWidth: '560px',
      margin: '40px auto',
      padding: '0 16px',
    }}>
      <div style={{
        background: designTokens.colorSurface,
        borderRadius: '12px',
        border: `1px solid ${designTokens.colorBorder}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '32px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: designTokens.colorText,
          }}>Terms of Service & Conditions</h1>
        </div>

        {/* Scrollable Content */}
        <div style={{
          maxHeight: '420px',
          overflowY: 'auto',
          paddingRight: '8px',
          marginTop: '20px',
        }}>
          {/* Section 1 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                background: designTokens.colorPrimary,
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700',
              }}>1</span>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: designTokens.colorText }}>RESPONSIBLE USE</h3>
            </div>
            {['For clinical assessment ONLY', 'Students with documented communication needs only', 'Supervised by qualified professionals'].map((item, idx) => (
              <p key={idx} style={{ fontSize: '0.875rem', color: designTokens.colorText, margin: '4px 0' }}>✓ {item}</p>
            ))}
          </div>

          {/* Section 2 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                background: designTokens.colorPrimary,
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700',
              }}>2</span>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: designTokens.colorText }}>PROFESSIONAL CONDUCT</h3>
            </div>
            {['Teachers/SEND officers hold proper credentials', 'Sessions conducted ethically', 'Student safety is paramount'].map((item, idx) => (
              <p key={idx} style={{ fontSize: '0.875rem', color: designTokens.colorText, margin: '4px 0' }}>✓ {item}</p>
            ))}
          </div>

          {/* Section 3 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                background: designTokens.colorPrimary,
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700',
              }}>3</span>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: designTokens.colorText }}>DATA PROTECTION</h3>
            </div>
            {['Comply with UAE Federal Decree-Law No. 45/2021 (PDPL)', 'Encryption at rest & in transit', 'Regular security audits'].map((item, idx) => (
              <p key={idx} style={{ fontSize: '0.875rem', color: designTokens.colorText, margin: '4px 0' }}>✓ {item}</p>
            ))}
          </div>

          {/* Section 4 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                background: designTokens.colorPrimary,
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700',
              }}>4</span>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: designTokens.colorText }}>LIMITATION OF LIABILITY</h3>
            </div>
            <p style={{
              fontSize: '0.875rem',
              color: designTokens.colorTextMuted,
              fontStyle: 'italic',
              background: designTokens.colorSurface2,
              borderRadius: '4px',
              padding: '10px 12px',
            }}>SyNAPSE provides tools, not medical advice. Clinical interpretation remains the responsibility of the assessment professional.</p>
          </div>

          {/* Section 5 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                background: designTokens.colorPrimary,
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700',
              }}>5</span>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: designTokens.colorText }}>INDEMNIFICATION</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: designTokens.colorTextMuted }}>Users agree to indemnify SyNAPSE from misuse or improper implementation.</p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleNextStep}
            style={{
              width: '100%',
              background: designTokens.colorPrimary,
              color: 'white',
              padding: '14px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 180ms ease',
            }}
            onMouseEnter={(e) => e.target.style.background = designTokens.colorPrimaryHover}
            onMouseLeave={(e) => e.target.style.background = designTokens.colorPrimary}
          >
            I AGREE TO TERMS
          </button>
          <button
            onClick={handlePrevStep}
            style={{
              width: '100%',
              background: 'transparent',
              border: `1px solid ${designTokens.colorBorder}`,
              color: designTokens.colorText,
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            BACK
          </button>
        </div>
      </div>
    </div>
  );

  // Step 3: Informed Consent
  const InformedConsentStep = () => (
    <div style={{
      maxWidth: '560px',
      margin: '40px auto',
      padding: '0 16px',
    }}>
      <div style={{
        background: designTokens.colorSurface,
        borderRadius: '12px',
        border: `1px solid ${designTokens.colorBorder}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '32px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: designTokens.colorText,
            marginBottom: '12px',
          }}>Informed Consent for Data Processing</h1>
          <div style={{
            background: designTokens.colorSurface2,
            border: `1px solid ${designTokens.colorBorder}`,
            borderRadius: '9999px',
            padding: '4px 12px',
            fontSize: '0.75rem',
            color: designTokens.colorTextMuted,
            display: 'inline-flex',
            gap: '8px',
          }}>
            Student: Alex Chen | DOB: 03/06/2016
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{
          maxHeight: '420px',
          overflowY: 'auto',
          paddingRight: '8px',
          marginTop: '20px',
        }}>
          {/* Parent Consent */}
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: designTokens.colorText,
            padding: '12px 0 8px',
          }}>👤 PARENT/GUARDIAN CONSENT</h3>
          <p style={{
            fontSize: '0.875rem',
            color: designTokens.colorTextMuted,
            marginBottom: '12px',
          }}>I consent to SyNAPSE collecting and using the following data for educational assessment:</p>

          {/* Checkboxes */}
          {Object.entries(consentCheckboxes).map(([key, value]) => (
            <div key={key} style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: `1px solid ${designTokens.colorDivider}`,
              fontSize: '0.875rem',
            }}>
              <input
                type="checkbox"
                checked={value}
                onChange={() => setConsentCheckboxes({ ...consentCheckboxes, [key]: !value })}
                style={{ accentColor: designTokens.colorPrimary, cursor: 'pointer' }}
              />
              <label style={{ cursor: 'pointer', color: designTokens.colorText }}>
                {key === 'facial' && 'Facial expressions (for emotion detection)'}
                {key === 'posture' && 'Body posture & movement tracking'}
                {key === 'voice' && 'Voice recordings & transcription'}
                {key === 'communication' && 'Communication selections'}
                {key === 'signals' && 'Baseline psychological signals'}
                {key === 'metrics' && 'Aggregated progress metrics'}
              </label>
            </div>
          ))}

          {/* Understanding Block */}
          <div style={{
            background: designTokens.colorSurface2,
            borderRadius: '8px',
            padding: '14px',
            marginTop: '16px',
          }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: designTokens.colorSuccess,
              marginBottom: '8px',
            }}>✓ I understand:</h4>
            {['Data is encrypted and secured', 'Facial recognition used only for emotion not identity', 'Video is NOT stored (only processed signals)', 'Data will be retained for 2 years', 'I can withdraw consent at any time', 'Results will be reviewed by trained professionals'].map((item, idx) => (
              <p key={idx} style={{ fontSize: '0.875rem', color: designTokens.colorTextMuted, margin: '4px 0', lineHeight: '1.7' }}>• {item}</p>
            ))}
          </div>

          {/* Signature Fields */}
          <div style={{ marginTop: '16px' }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: designTokens.colorText,
              display: 'block',
              marginBottom: '4px',
            }}>Parent/Guardian Name:</label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${designTokens.colorBorder}`,
                borderRadius: '4px',
                padding: '10px 12px',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 180ms ease',
              }}
              onFocus={(e) => e.target.style.borderColor = designTokens.colorPrimary}
              onBlur={(e) => e.target.style.borderColor = designTokens.colorBorder}
            />
          </div>

          <div style={{ marginTop: '12px' }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: designTokens.colorText,
              display: 'block',
              marginBottom: '4px',
            }}>Signature:</label>
            <input
              type="text"
              value={parentSignature}
              onChange={(e) => setParentSignature(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${designTokens.colorBorder}`,
                borderRadius: '4px',
                padding: '10px 12px',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: designTokens.colorTextFaint, marginTop: '4px' }}>Typing your name constitutes electronic signature</p>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: designTokens.colorText,
              display: 'block',
              marginBottom: '4px',
            }}>Date:</label>
            <input
              type="date"
              value={parentDate}
              onChange={(e) => setParentDate(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${designTokens.colorBorder}`,
                borderRadius: '4px',
                padding: '10px 12px',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Student Assent */}
          <hr style={{ border: 'none', borderTop: `1px solid ${designTokens.colorDivider}`, margin: '20px 0' }} />
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: designTokens.colorText,
            padding: '12px 0 8px',
          }}>STUDENT ASSENT (Age 7+)</h3>
          <p style={{
            fontSize: '0.875rem',
            color: designTokens.colorTextMuted,
            marginBottom: '12px',
          }}>I agree to use SyNAPSE to:</p>
          {['Talk with my teacher/parent', 'Let the system see my face', 'Use AAC cards to communicate', 'Help doctors understand me better'].map((item, idx) => (
            <p key={idx} style={{ fontSize: '0.875rem', color: designTokens.colorText, margin: '4px 0' }}>• {item}</p>
          ))}

          <div style={{ marginTop: '12px' }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: designTokens.colorText,
              display: 'block',
              marginBottom: '4px',
            }}>Student Name:</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${designTokens.colorBorder}`,
                borderRadius: '4px',
                padding: '10px 12px',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginTop: '12px', marginBottom: '12px' }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: designTokens.colorText,
              display: 'block',
              marginBottom: '4px',
            }}>Student Signature/Mark:</label>
            <input
              type="text"
              value={studentSignature}
              onChange={(e) => setStudentSignature(e.target.value)}
              style={{
                width: '100%',
                border: `1px solid ${designTokens.colorBorder}`,
                borderRadius: '4px',
                padding: '10px 12px',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: designTokens.colorTextFaint, marginTop: '4px' }}>Student agrees to participate</p>
          </div>

          <p style={{ fontSize: '0.75rem', color: designTokens.colorTextFaint, fontStyle: 'italic', marginTop: '16px' }}>
            Legal language: This consent complies with UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL), including lawful processing and parental/guardian consent for minors.
          </p>
        </div>

        {/* Footer Buttons */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button
            onClick={handleNextStep}
            style={{
              width: '100%',
              background: designTokens.colorPrimary,
              color: 'white',
              padding: '14px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            I CONSENT
          </button>
          <button
            onClick={handlePrevStep}
            style={{
              width: '100%',
              background: 'white',
              border: `1px solid ${designTokens.colorBorder}`,
              color: designTokens.colorText,
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            BACK
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: designTokens.colorError,
              fontSize: '0.875rem',
              padding: '8px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            DECLINE
          </button>
        </div>
      </div>
    </div>
  );

  // Step 4: Device Permissions
  const DevicePermissionsStep = () => {
    const allRequiredGranted = permissions.camera && permissions.motion && permissions.speaker;

    const PermissionCard = ({ icon, name, required, checked, onChange, purpose, dataStored, infoBox, testButton }) => (
      <div style={{
        border: `1px solid ${designTokens.colorBorder}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        background: 'white',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}>
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: designTokens.colorText,
            }}>{icon} {name}</h4>
            {required && (
              <p style={{
                fontSize: '0.75rem',
                color: designTokens.colorError,
                fontWeight: '500',
                marginTop: '2px',
              }}>Required</p>
            )}
          </div>
          <div style={{
            background: checked ? designTokens.colorSuccessBg : designTokens.colorWarningBg,
            color: checked ? designTokens.colorSuccess : designTokens.colorWarning,
            border: `1px solid ${checked ? designTokens.colorSuccessBorder : designTokens.colorWarningBorder}`,
            borderRadius: '9999px',
            padding: '3px 10px',
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: checked ? designTokens.colorSuccess : designTokens.colorWarning,
            }}></span>
            {checked ? 'ENABLED' : 'REQUEST NEEDED'}
          </div>
        </div>

        <p style={{
          fontSize: '0.875rem',
          color: designTokens.colorTextMuted,
          marginTop: '8px',
        }}><strong style={{ color: designTokens.colorText }}>Permission Type:</strong> {purpose}</p>
        <p style={{
          fontSize: '0.875rem',
          color: designTokens.colorTextMuted,
        }}><strong style={{ color: designTokens.colorText }}>Data Stored:</strong> {dataStored}</p>

        {infoBox && (
          <div style={{
            background: '#f0f9fa',
            borderRadius: '4px',
            padding: '12px',
            marginTop: '10px',
          }}>
            <p style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: designTokens.colorText,
              marginBottom: '6px',
            }}>About facial detection:</p>
            {['No identification (doesn\'t recognize who)', 'Emotion classification only', 'Raw video never saved to disk', 'Can be disabled anytime'].map((item, idx) => (
              <p key={idx} style={{
                fontSize: '0.875rem',
                color: designTokens.colorTextMuted,
              }}>• {item}</p>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          gap: '8px',
        }}>
          <label style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            fontSize: '0.875rem',
            color: designTokens.colorText,
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onChange(!checked)}
              style={{ accentColor: designTokens.colorPrimary, cursor: 'pointer', width: '16px', height: '16px' }}
            />
            Allow {name}
          </label>
          {testButton && (
            <button
              style={{
                background: designTokens.colorPrimary,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
              onClick={() => alert('Camera test initiated')}
            >
              {testButton}
            </button>
          )}
        </div>
      </div>
    );

    return (
      <div style={{
        maxWidth: '580px',
        margin: '40px auto',
        padding: '0 16px',
      }}>
        <div style={{
          background: designTokens.colorSurface,
          borderRadius: '12px',
          border: `1px solid ${designTokens.colorBorder}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '32px',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔌</div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: designTokens.colorText,
              marginBottom: '4px',
            }}>Device Permissions & Toggles</h1>
            <p style={{ fontSize: '0.875rem', color: designTokens.colorTextMuted }}>Control what SyNAPSE can access</p>
          </div>

          {/* Permissions List */}
          <div style={{
            maxHeight: '500px',
            overflowY: 'auto',
            paddingRight: '8px',
            marginTop: '20px',
          }}>
            <PermissionCard
              icon="📷"
              name="Camera Access"
              required={true}
              checked={permissions.camera}
              onChange={(val) => togglePermission('camera')}
              purpose="Continuous during sessions"
              dataStored="Processed signals only"
              infoBox={true}
              testButton="Test Camera"
            />
            <PermissionCard
              icon="🎤"
              name="Microphone Access"
              required={false}
              checked={permissions.microphone}
              onChange={(val) => togglePermission('microphone')}
              purpose="During interactions only"
              dataStored="Transcripts (30 days retention)"
            />
            <PermissionCard
              icon="📊"
              name="Motion/Accelerometer"
              required={true}
              checked={permissions.motion}
              onChange={(val) => togglePermission('motion')}
              purpose="Continuous"
              dataStored="Real-time motion vectors"
            />
            <PermissionCard
              icon="🔊"
              name="Speaker/Audio Output"
              required={true}
              checked={permissions.speaker}
              onChange={(val) => togglePermission('speaker')}
              purpose="Always (for accessibility)"
              dataStored="None"
            />
            <PermissionCard
              icon="📍"
              name="Location Access"
              required={false}
              checked={permissions.location}
              onChange={(val) => togglePermission('location')}
              purpose="When recording"
              dataStored="Building/Room name only (not GPS)"
            />
            <PermissionCard
              icon="🔐"
              name="Biometric Authentication"
              required={false}
              checked={permissions.biometric}
              onChange={(val) => togglePermission('biometric')}
              purpose="For login only"
              dataStored="Encrypted, never shared"
            />

            {/* Advanced Settings */}
            <div style={{
              border: `1px solid ${designTokens.colorBorder}`,
              borderRadius: '8px',
              padding: '16px',
              marginTop: '4px',
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '700',
                color: designTokens.colorText,
                marginBottom: '12px',
              }}>⚙️ Advanced Settings</h3>

              <p style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: designTokens.colorText,
                marginBottom: '8px',
              }}>Computer Vision Processing:</p>
              <label style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '0.875rem',
                color: designTokens.colorText,
                cursor: 'pointer',
              }}>
                <input type="radio" name="processing" checked={processingLocal} onChange={() => setProcessingLocal(true)} style={{ accentColor: designTokens.colorPrimary, cursor: 'pointer' }} />
                Local device (recommended for privacy)
              </label>
              <label style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: designTokens.colorText,
                cursor: 'pointer',
              }}>
                <input type="radio" name="processing" checked={!processingLocal} onChange={() => setProcessingLocal(false)} style={{ accentColor: designTokens.colorPrimary, cursor: 'pointer' }} />
                Cloud server (faster)
              </label>

              <div style={{
                background: designTokens.colorSurface2,
                borderRadius: '4px',
                padding: '12px',
                marginTop: '12px',
                fontSize: '0.75rem',
                color: designTokens.colorTextMuted,
                lineHeight: '1.8',
              }}>
                • Video frames: 24 hours (auto-delete)<br/>
                • Processed signals: 2 years (UAE PDPL retention policy)<br/>
                • Aggregated data: Indefinite (anonymized)
              </div>

              <p style={{
                fontSize: '0.75rem',
                color: designTokens.colorTextFaint,
                textAlign: 'right',
                marginTop: '8px',
              }}>Last updated: {new Date().toLocaleString('en-GB')}</p>
            </div>

            {/* All Permissions Granted Banner */}
            {allRequiredGranted && (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
              }}>
                <span>✅ ✅</span>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: designTokens.colorSuccess,
                  margin: 0,
                }}>All required permissions granted</p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleCompleteOnboarding}
              style={{
                width: '100%',
                background: designTokens.colorPrimary,
                color: 'white',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              SAVE PREFERENCES & CONTINUE
            </button>
            <button
              onClick={handlePrevStep}
              style={{
                width: '100%',
                background: 'white',
                border: `1px solid ${designTokens.colorBorder}`,
                color: designTokens.colorText,
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              BACK
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: designTokens.colorBg,
      minHeight: '100vh',
    }}>
      {/* Progress Bar */}
      {step <= 4 && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: designTokens.colorSurface,
          borderBottom: `1px solid ${designTokens.colorDivider}`,
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: designTokens.colorTextMuted,
            margin: 0,
          }}>Setup Progress</p>
          <p style={{
            fontSize: '0.875rem',
            color: designTokens.colorTextMuted,
            margin: 0,
          }}>Step {step} of 4</p>
          <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: designTokens.colorBorder, borderRadius: '9999px' }}>
            <div style={{
              height: '100%',
              background: designTokens.colorPrimary,
              width: `${(step / 4) * 100}%`,
              transition: 'width 180ms ease',
              borderRadius: '9999px',
            }}></div>
          </div>
        </div>
      )}

      {/* Step Content */}
      {step === 1 && <PrivacyPolicyStep />}
      {step === 2 && <TermsOfServiceStep />}
      {step === 3 && <InformedConsentStep />}
      {step === 4 && <DevicePermissionsStep />}
    </div>
  );
};

export default Onboarding;
