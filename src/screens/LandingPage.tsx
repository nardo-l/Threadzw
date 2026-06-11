// src/screens/LandingPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onStartFree: () => void;
  onLoginSuccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartFree, onLoginSuccess }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100svh',
      background: '#000000',
      maxWidth: 430,
      margin: '0 auto',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#ffffff'
    }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 20px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100
      }}>
        <span style={{
          fontSize: 20,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.5px'
        }}>
          ThreadZW
        </span>
        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center'
        }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent',
              color: '#ffffff',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 10,
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Log in
          </button>
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: '#c8ff00',
              color: '#000000',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Start Free
          </button>
        </div>
      </nav>

      {/* FREE BETA BANNER */}
      <div style={{
        background: '#121215',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
      }}>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#c8ff00',
          flexShrink: 0
        }} />
        <p style={{
          fontSize: 13,
          color: '#ffffff',
          margin: 0,
          fontWeight: 600,
          textAlign: 'center'
        }}>
          Free for everyone — no card needed, no limits
        </p>
      </div>

      {/* HERO */}
      <div style={{
        padding: '48px 24px 40px',
        textAlign: 'center',
        background: '#000000'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#121215',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
          padding: '6px 14px',
          marginBottom: 24
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#00c864'
          }} />
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#a1a1aa',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Made in Zimbabwe
          </span>
        </div>

        <h1 style={{
          fontSize: 40,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-1.5px',
          lineHeight: 1.05,
          margin: '0 0 16px'
        }}>
          Create your online shop in minutes.
        </h1>

        <p style={{
          fontSize: 16,
          color: '#a1a1aa',
          lineHeight: 1.6,
          margin: '0 0 32px'
        }}>
          No website needed. Upload products, share your link, receive orders on WhatsApp.
        </p>

        <button
          onClick={() => navigate('/signup')}
          style={{
            width: '100%',
            padding: '16px',
            background: '#c8ff00',
            color: '#000000',
            border: 'none',
            borderRadius: 10,
            fontWeight: 900,
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 12,
            letterSpacing: '0.3px'
          }}
        >
          Start Free — No Card Needed
        </button>

        <button
          onClick={() => {
            window.open('/shop/demo', '_blank');
          }}
          style={{
            width: '100%',
            padding: '14px',
            background: 'transparent',
            color: '#ffffff',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer'
          }}
        >
          View Demo Shop
        </button>

        {/* Social proof */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginTop: 24
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            {['K','T','B','A'].map((letter, i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: [
                    '#c8ff00',
                    '#121215',
                    '#27272a',
                    '#52525b'
                  ][i],
                  border: '2px solid #000000',
                  marginLeft: i > 0 ? -8 : 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 900,
                  color: i === 0 ? '#000000' : '#ffffff'
                }}
              >
                {letter}
              </div>
            ))}
          </div>
          <p style={{
            fontSize: 13,
            color: '#a1a1aa',
            margin: 0
          }}>
            <strong style={{ color: '#ffffff' }}>
              Shops already live
            </strong>{' '}
            across Zimbabwe
          </p>
        </div>
      </div>

      {/* PROBLEM SECTION */}
      <div style={{
        background: '#0e0e12',
        padding: '40px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '2px',
          color: '#c8ff00',
          textTransform: 'uppercase',
          margin: '0 0 12px',
          background: '#121215',
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: 6,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          The Problem
        </p>
        <h2 style={{
          fontSize: 30,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.8px',
          lineHeight: 1.1,
          margin: '0 0 28px'
        }}>
          Selling on Instagram is broken.
        </h2>

        {[
          {
            title: 'Price questions all day',
            desc: 'Customers DM asking how much every item costs instead of just seeing it.'
          },
          {
            title: 'No product catalogue',
            desc: 'Customers scroll through old posts trying to find what you sell.'
          },
          {
            title: 'Sales lost while replying',
            desc: 'By the time you reply to a DM the customer has moved on.'
          },
          {
            title: 'Invisible to new customers',
            desc: 'No way for new people to discover your shop online.'
          }
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: '#121215',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '16px 18px',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14
            }}
          >
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ff4444',
              flexShrink: 0,
              marginTop: 6
            }} />
            <div>
              <p style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 4px'
              }}>
                {item.title}
              </p>
              <p style={{
                fontSize: 13,
                color: '#a1a1aa',
                margin: 0,
                lineHeight: 1.5
              }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* SOLUTION SECTION */}
      <div style={{
        background: '#000000',
        padding: '40px 24px'
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '2px',
          color: '#c8ff00',
          textTransform: 'uppercase',
          margin: '0 0 12px'
        }}>
          The Solution
        </p>
        <h2 style={{
          fontSize: 30,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.8px',
          lineHeight: 1.1,
          margin: '0 0 28px'
        }}>
          Your store. Always open.
        </h2>

        {[
          {
            step: '1',
            title: 'Create your shop',
            desc: 'Set up your storefront in minutes. Add logo, banner and products.'
          },
          {
            step: '2',
            title: 'Share your link',
            desc: 'One link for Instagram bio, WhatsApp status, TikTok profile.'
          },
          {
            step: '3',
            title: 'Receive orders',
            desc: 'Customers browse and order directly to your WhatsApp.'
          }
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 24
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#c8ff00',
              color: '#000000',
              fontWeight: 900,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {item.step}
            </div>
            <div style={{ paddingTop: 4 }}>
              <p style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 4px'
              }}>
                {item.title}
              </p>
              <p style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
                margin: 0,
                lineHeight: 1.5
              }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* FEATURES SECTION */}
      <div style={{
        background: '#0e0e12',
        padding: '40px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '2px',
          color: '#c8ff00',
          textTransform: 'uppercase',
          margin: '0 0 12px',
          background: '#121215',
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: 6,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          Features
        </p>
        <h2 style={{
          fontSize: 30,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.8px',
          margin: '0 0 28px'
        }}>
          Everything you need.
        </h2>

        {[
          {
            title: 'Your own shop link',
            desc: 'threadzw.vercel.app/shop/yourshop'
          },
          {
            title: 'Product catalogue',
            desc: 'Customers browse without messaging first.'
          },
          {
            title: 'Instagram-style categories',
            desc: 'Organise products with cover images.'
          },
          {
            title: 'WhatsApp ordering',
            desc: 'Order details sent straight to your number.'
          },
          {
            title: 'Shop analytics',
            desc: 'See views and top products.'
          },
          {
            title: 'Completely free',
            desc: 'No card. No trial. Free for 4 months.'
          }
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px 0',
              borderBottom: i < 5 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none'
            }}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#c8ff00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2
            }}>
              <svg
                width="10" height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#000000"
                strokeWidth="3.5"
              >
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 2px'
              }}>
                {item.title}
              </p>
              <p style={{
                fontSize: 13,
                color: '#a1a1aa',
                margin: 0
              }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* FREE BETA SECTION */}
      <div style={{
        background: '#121215',
        margin: '32px 16px',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '28px 24px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          height: 3,
          background: '#c8ff00',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0
        }} />

        <p style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '2px',
          color: '#c8ff00',
          textTransform: 'uppercase',
          margin: '0 0 12px'
        }}>
          Free Beta
        </p>

        <h2 style={{
          fontSize: 28,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.5px',
          margin: '0 0 8px'
        }}>
          Free for 4 months.
        </h2>

        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.6,
          margin: '0 0 24px'
        }}>
          ThreadZW is completely free while we build and improve the platform. No card required. No hidden charges. We may ask for your feedback after one month of use.
        </p>

        {[
          'No credit card needed',
          'No usage limits',
          'Unlimited products',
          'Full access to all features'
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10
            }}
          >
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#c8ff00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg
                width="9" height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#000000"
                strokeWidth="3.5"
              >
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.8)'
            }}>
              {item}
            </span>
          </div>
        ))}

        <button
          onClick={() => navigate('/signup')}
          style={{
            width: '100%',
            padding: '15px',
            background: '#c8ff00',
            color: '#000000',
            border: 'none',
            borderRadius: 10,
            fontWeight: 900,
            fontSize: 16,
            cursor: 'pointer',
            marginTop: 20
          }}
        >
          Create Your Shop Now
        </button>
      </div>

      {/* FAQ SECTION */}
      <div style={{
        padding: '0 24px 40px',
        background: '#000000'
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.5px',
          margin: '0 0 20px'
        }}>
          Questions.
        </h2>

        {[
          {
            q: 'Is ThreadZW really free?',
            a: 'Yes. Completely free for the next 4 months. No card, no trial, no limits.'
          },
          {
            q: 'Do my customers need to download anything?',
            a: 'No. Your store works in any browser. Customers tap your link and browse immediately.'
          },
          {
            q: 'How do I receive payments from customers?',
            a: 'ThreadZW handles ordering. Payments go directly between you and your customers via EcoCash, cash, or bank transfer.'
          },
          {
            q: 'Can I customise my store?',
            a: 'Yes. Upload your logo, banner, products and create your own categories.'
          },
          {
            q: 'What happens after 4 months?',
            a: 'We will let you know before anything changes. The goal is to keep ThreadZW affordable for Zimbabwean businesses.'
          }
        ].map((item, i) => (
          <FaqItem 
            key={i} 
            question={item.q} 
            answer={item.a} 
          />
        ))}
      </div>

      {/* FINAL CTA */}
      <div style={{
        background: '#0e0e12',
        padding: '48px 24px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <h2 style={{
          fontSize: 36,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-1px',
          lineHeight: 1.1,
          margin: '0 0 12px',
          textTransform: 'uppercase'
        }}>
          Your shop is waiting.
        </h2>
        <p style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.5)',
          margin: '0 0 28px'
        }}>
          Free. No card. Start in minutes.
        </p>
        <button
          onClick={() => navigate('/signup')}
          style={{
            width: '100%',
            padding: '16px',
            background: '#c8ff00',
            color: '#000000',
            border: 'none',
            borderRadius: 10,
            fontWeight: 900,
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 12
          }}
        >
          Start Free
        </button>
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            padding: '14px',
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Already have an account? Log in
        </button>
      </div>

      {/* FOOTER */}
      <div style={{
        background: '#000000',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px 24px 40px',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: 16,
          fontWeight: 900,
          color: '#ffffff',
          margin: '0 0 4px'
        }}>
          ThreadZW
        </p>
        <p style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.3)',
          margin: '0 0 16px'
        }}>
          Made in Zimbabwe
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 20
        }}>
          {['Terms', 'Privacy', 'Contact'].map(link => (
            <span
              key={link}
              style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.3)',
                cursor: 'pointer'
              }}
            >
              {link}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// FAQ accordion item
interface FaqItemProps {
  question: string;
  answer: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: '#121215',
      borderRadius: 12,
      marginBottom: 8,
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '16px 18px',
          background: 'none',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          gap: 12,
          textAlign: 'left'
        }}
      >
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#ffffff'
        }}>
          {question}
        </span>
        <svg
          width="16" height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      {open && (
        <div style={{
          padding: '0 18px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <p style={{
            fontSize: 14,
            color: '#a1a1aa',
            lineHeight: 1.6,
            margin: '12px 0 0'
          }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};
