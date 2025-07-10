
'use client';
import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import html2canvas from 'html2canvas';
import ProfileCard from './ProfileCard';
import SearchAndLeaderboard from './SearchAndLeaderboard';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "MONAD",
    title: "Currently Testnet",
    handle: "monad_xyz",
    status: "Online",
    avatarUrl: "https://docs.monad.xyz/img/monad_logo.png"
  });

  // Clear all saved data on mount - run only once
  useEffect(() => {
    const hasCleared = sessionStorage.getItem('dataCleared');
    if (!hasCleared) {
      localStorage.removeItem('profileData');
      localStorage.removeItem('profileSearchCounts');
      localStorage.removeItem('userProfiles');
      localStorage.removeItem('savedAvatars');
      localStorage.removeItem('profileSettings');
      sessionStorage.setItem('dataCleared', 'true');
    }
  }, []);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleProfileSelect = (profile: any) => {
    setProfileData({
      name: profile.name,
      title: profile.title,
      handle: profile.handle,
      status: profile.status || "Online",
      avatarUrl: profile.avatarUrl
    });
  };

  const handleProfileUpdate = (data: {
    name?: string;
    title?: string;
    handle?: string;
    avatarUrl?: string;
    status?: string;
  }) => {
    setProfileData(prev => ({
      ...prev,
      ...data
    }));
  };

  const handleExportCard = async (format: 'png') => {
    // Target only the card element, not the wrapper with buttons
    const cardElement = document.querySelector('.pc-card') as HTMLElement;
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: cardElement.offsetWidth,
        height: cardElement.offsetHeight,
        ignoreElements: (element) => {
          // Ignore all button and UI elements that shouldn't be in the export
          return element.classList.contains('pc-export-btn') || 
                 element.classList.contains('pc-settings-btn') || 
                 element.classList.contains('pc-settings-panel') ||
                 element.closest('.pc-export-btn') !== null ||
                 element.closest('.pc-settings-btn') !== null ||
                 element.closest('.pc-settings-panel') !== null;
        }
      });

      const link = document.createElement('a');
      link.download = `monad-profile-card-${profileData.handle}.${format}`;
      link.href = canvas.toDataURL(`image/${format === 'jpeg' ? 'jpeg' : 'png'}`);
      link.click();
    } catch (error) {
      console.error('Error exporting card:', error);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Floating Monad Logo */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 500,
        animation: 'float 3s ease-in-out infinite'
      }}>
        <img 
          src="/monad_logo.ico" 
          alt="Monad Logo" 
          style={{
            width: '80px',
            height: '80px',
            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5))',
            background: 'transparent'
          }}
        />
      </div>

      {/* Wallet Connect Button */}
      {mounted && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1001
        }}>
          <ConnectButton 
            showBalance={false}
            accountStatus="address"
            chainStatus="icon"
          />
        </div>
      )}

      {/* Save as PNG Toggle */}
      {mounted && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '20px',
          zIndex: 1001
        }}>
          <button
            onClick={() => handleExportCard('png')}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            📥 Save as PNG
          </button>
        </div>
      )}

      {/* Search and Leaderboard - moved to left */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000
      }}>
        <SearchAndLeaderboard onProfileSelect={handleProfileSelect} />
      </div>

      {/* Heading */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '60px',
        marginTop: '80px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: 'white',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fff, #c137ff, #07c6ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          letterSpacing: '2px',
          margin: 0
        }}>
          MONAD PROFILE CARD
        </h1>
      </div>

      {/* Profile Card */}
      <ProfileCard
        name={profileData.name}
        title={profileData.title}
        handle={profileData.handle}
        status={profileData.status}
        contactText=''
        avatarUrl={profileData.avatarUrl}
        showUserInfo={true}
        enableTilt={true}
        onContactClick={() => window.open(`https://x.com/${profileData.handle}`, '_blank')}
        onProfileUpdate={handleProfileUpdate}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateX(-50%) translateY(0px);
          }
          50% {
            transform: translateX(-50%) translateY(-10px);
          }
          100% {
            transform: translateX(-50%) translateY(0px);
          }
        }
      `}</style>
    </div>
  );
}
