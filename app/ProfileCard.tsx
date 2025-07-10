
import React, { useEffect, useRef, useCallback, useMemo } from "react";
import "./ProfileCard.css";
import html2canvas from 'html2canvas';

interface ProfileUpdateData {
  name?: string;
  title?: string;
  handle?: string;
  avatarUrl?: string;
  status?: string;
}

interface ProfileCardProps {
  avatarUrl: string;
  iconUrl?: string;
  grainUrl?: string;
  behindGradient?: string;
  innerGradient?: string;
  showBehindGradient?: boolean;
  className?: string;
  enableTilt?: boolean;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
  onProfileUpdate?: (data: ProfileUpdateData) => void;
  showSettings?: boolean;
  onToggleSettings?: () => void;
}

const DEFAULT_BEHIND_GRADIENT =
  "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(266,100%,90%,var(--card-opacity)) 4%,hsla(266,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(266,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(266,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00ffaac4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00c1ffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#c137ffff 0%,#07c6ffff 40%,#07c6ffff 60%,#c137ffff 100%)";

const DEFAULT_INNER_GRADIENT =
  "linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)";

const ANIMATION_CONFIG = {
  SMOOTH_DURATION: 600,
  INITIAL_DURATION: 1500,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
} as const;

const clamp = (value: number, min = 0, max = 100): number =>
  Math.min(Math.max(value, min), max);

const round = (value: number, precision = 3): number =>
  parseFloat(value.toFixed(precision));

const adjust = (
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number =>
  round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));

const easeInOutCubic = (x: number): number =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

const DEFAULT_AVATAR_URL = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face";

// Background removal function
const removeBackground = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple background removal based on edge detection and transparency
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Remove white/light backgrounds
        const brightness = (r + g + b) / 3;
        const isBackground = brightness > 240 || 
                           (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && brightness > 200);
        
        if (isBackground) {
          data[i + 3] = 0; // Make transparent
        }
      }
      
      // Put modified data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      resolve(canvas.toDataURL('image/png'));
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  avatarUrl = "https://docs.monad.xyz/img/monad_logo.png",
  iconUrl = "https://docs.monad.xyz/img/monad_logo.png",
  grainUrl,
  behindGradient,
  innerGradient,
  showBehindGradient = true,
  className = "",
  enableTilt = true,
  miniAvatarUrl,
  name = "Javi A. Torres",
  title = "Software Engineer",
  handle = "javicodes",
  status = "Online",
  contactText = "Contact",
  showUserInfo = true,
  onContactClick,
  onProfileUpdate,
  showSettings = false,
  onToggleSettings,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = React.useState({
    name: name || "",
    title: title || "",
    handle: handle || "",
    status: status || "Online",
    avatarUrl: avatarUrl || ""
  });
  const [previewAvatar, setPreviewAvatar] = React.useState<string | null>(null);
  const [backgroundRemoved, setBackgroundRemoved] = React.useState(false);

  const animationHandlers = useMemo(() => {
    if (!enableTilt) return null;

    let rafId: number | null = null;

    const updateCardTransform = (
      offsetX: number,
      offsetY: number,
      card: HTMLElement,
      wrap: HTMLElement
    ) => {
      const width = card.clientWidth;
      const height = card.clientHeight;

      const percentX = clamp((100 / width) * offsetX);
      const percentY = clamp((100 / height) * offsetY);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties = {
        "--pointer-x": `${percentX}%`,
        "--pointer-y": `${percentY}%`,
        "--background-x": `${adjust(percentX, 0, 100, 35, 65)}%`,
        "--background-y": `${adjust(percentY, 0, 100, 35, 65)}%`,
        "--pointer-from-center": `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        "--pointer-from-top": `${percentY / 100}`,
        "--pointer-from-left": `${percentX / 100}`,
        "--rotate-x": `${round(-(centerX / 5))}deg`,
        "--rotate-y": `${round(centerY / 4)}deg`,
      };

      Object.entries(properties).forEach(([property, value]) => {
        wrap.style.setProperty(property, value);
      });
    };

    const createSmoothAnimation = (
      duration: number,
      startX: number,
      startY: number,
      card: HTMLElement,
      wrap: HTMLElement
    ) => {
      const startTime = performance.now();
      const targetX = wrap.clientWidth / 2;
      const targetY = wrap.clientHeight / 2;

      const animationLoop = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = clamp(elapsed / duration);
        const easedProgress = easeInOutCubic(progress);

        const currentX = adjust(easedProgress, 0, 1, startX, targetX);
        const currentY = adjust(easedProgress, 0, 1, startY, targetY);

        updateCardTransform(currentX, currentY, card, wrap);

        if (progress < 1) {
          rafId = requestAnimationFrame(animationLoop);
        }
      };

      rafId = requestAnimationFrame(animationLoop);
    };

    return {
      updateCardTransform,
      createSmoothAnimation,
      cancelAnimation: () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
    };
  }, [enableTilt]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const card = cardRef.current;
      const wrap = wrapRef.current;

      if (!card || !wrap || !animationHandlers) return;

      const rect = card.getBoundingClientRect();
      animationHandlers.updateCardTransform(
        event.clientX - rect.left,
        event.clientY - rect.top,
        card,
        wrap
      );
    },
    [animationHandlers]
  );

  const handlePointerEnter = useCallback(() => {
    const card = cardRef.current;
    const wrap = wrapRef.current;

    if (!card || !wrap || !animationHandlers) return;

    animationHandlers.cancelAnimation();
    wrap.classList.add("active");
    card.classList.add("active");
  }, [animationHandlers]);

  const handlePointerLeave = useCallback(
    (event: PointerEvent) => {
      const card = cardRef.current;
      const wrap = wrapRef.current;

      if (!card || !wrap || !animationHandlers) return;

      animationHandlers.createSmoothAnimation(
        ANIMATION_CONFIG.SMOOTH_DURATION,
        event.offsetX,
        event.offsetY,
        card,
        wrap
      );
      wrap.classList.remove("active");
      card.classList.remove("active");
    },
    [animationHandlers]
  );

  useEffect(() => {
    if (!enableTilt || !animationHandlers) return;

    const card = cardRef.current;
    const wrap = wrapRef.current;

    if (!card || !wrap) return;

    const pointerMoveHandler = handlePointerMove as EventListener;
    const pointerEnterHandler = handlePointerEnter as EventListener;
    const pointerLeaveHandler = handlePointerLeave as EventListener;

    card.addEventListener("pointerenter", pointerEnterHandler);
    card.addEventListener("pointermove", pointerMoveHandler);
    card.addEventListener("pointerleave", pointerLeaveHandler);

    const initialX = wrap.clientWidth - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;

    animationHandlers.updateCardTransform(initialX, initialY, card, wrap);
    animationHandlers.createSmoothAnimation(
      ANIMATION_CONFIG.INITIAL_DURATION,
      initialX,
      initialY,
      card,
      wrap
    );

    return () => {
      card.removeEventListener("pointerenter", pointerEnterHandler);
      card.removeEventListener("pointermove", pointerMoveHandler);
      card.removeEventListener("pointerleave", pointerLeaveHandler);
      animationHandlers.cancelAnimation();
    };
  }, [
    enableTilt,
    animationHandlers,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
  ]);

  const cardStyle = useMemo(
    () =>
      ({
        "--icon": iconUrl ? `url(${iconUrl})` : "none",
        "--grain": grainUrl ? `url(${grainUrl})` : "none",
        "--behind-gradient": showBehindGradient
          ? (behindGradient ?? DEFAULT_BEHIND_GRADIENT)
          : "none",
        "--inner-gradient": innerGradient ?? DEFAULT_INNER_GRADIENT,
      }) as React.CSSProperties,
    [iconUrl, grainUrl, showBehindGradient, behindGradient, innerGradient]
  );

  const handleContactClick = useCallback(() => {
    onContactClick?.();
  }, [onContactClick]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = () => {
    if (onProfileUpdate && showSettings) {
      const updateData = { 
        name: formData.name,
        title: formData.title,
        handle: formData.handle,
        status: formData.status,
        avatarUrl: previewAvatar || formData.avatarUrl
      };
      onProfileUpdate(updateData);
    }
    setPreviewAvatar(null);
    setBackgroundRemoved(false);
    onToggleSettings?.();
  };

  React.useEffect(() => {
    if (showSettings) {
      setFormData({
        name: name || "",
        title: title || "",
        handle: handle || "",
        status: status || "Online",
        avatarUrl: avatarUrl || ""
      });
    } else {
      setPreviewAvatar(null);
      setBackgroundRemoved(false);
    }
  }, [showSettings, name, title, handle, status, avatarUrl]);

  return (
    <div className="pc-container">
      <div className="pc-background-panel">
        <div className="pc-background-logo"></div>
      </div>
      
      <div
        ref={wrapRef}
        className={`pc-card-wrapper ${className}`.trim()}
        style={cardStyle}
      >
        <section ref={cardRef} className="pc-card">
          <div className="pc-inside">
            <div className="pc-shine" />
            <div className="pc-glare" />
            <div className="pc-content pc-avatar-content">
              <img
                className={`avatar ${backgroundRemoved ? 'bg-removed' : ''}`}
                src={showSettings && previewAvatar ? previewAvatar : avatarUrl}
                alt={`${name || "User"} avatar`}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_AVATAR_URL;
                }}
              />
              {showUserInfo && (
                <div className="pc-user-info">
                  <div className="pc-user-details">
                    <div className="pc-mini-avatar">
                      <img
                        src={showSettings && previewAvatar ? previewAvatar : (miniAvatarUrl || avatarUrl)}
                        alt={`${name || "User"} mini avatar`}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_AVATAR_URL;
                        }}
                      />
                    </div>
                    <div className="pc-user-text">
                      <div 
                        className="pc-handle clickable"
                        onClick={() => window.open(`https://x.com/${showSettings ? formData.handle : handle}`, '_blank')}
                        style={{ cursor: 'pointer' }}
                      >
                        @{showSettings ? formData.handle : handle}
                      </div>
                      <div className="pc-status">
                        {showSettings ? formData.status : status}
                      </div>
                    </div>
                  </div>
                  <button
                    className="pc-contact-btn"
                    onClick={handleContactClick}
                    style={{ pointerEvents: "auto" }}
                    type="button"
                    aria-label={`Contact ${name || "user"} on X`}
                  >
                    <span className="pc-contact-icon">𝕏</span>
                    {contactText}
                  </button>
                </div>
              )}
            </div>
            <div className="pc-content">
              <div className="pc-details">
                <h3>{showSettings ? formData.name : name}</h3>
                <p>{showSettings ? formData.title : title}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Settings Button */}
        <button
          className="pc-settings-btn"
          onClick={onToggleSettings}
          style={{ pointerEvents: "auto" }}
          type="button"
          aria-label="Settings"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="pc-settings-panel">
          <div className="pc-settings-header">
            <h3>Customize Profile</h3>
            <button 
              className="pc-close-btn"
              onClick={onToggleSettings}
              type="button"
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          <div className="pc-settings-form">
            <div className="pc-form-group">
              <label htmlFor="name">Name:</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="pc-form-group">
              <label htmlFor="title">Title:</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter your title"
              />
            </div>

            <div className="pc-form-group">
              <label htmlFor="handle">X Handle:</label>
              <input
                id="handle"
                type="text"
                value={formData.handle}
                onChange={(e) => handleInputChange('handle', e.target.value)}
                placeholder="Enter X handle (without @)"
              />
            </div>

            <div className="pc-form-group">
              <label htmlFor="status">Status:</label>
              <input
                id="status"
                type="text"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                placeholder="Enter your status (e.g., Online, Coding, Away...)"
              />
            </div>

            <div className="pc-form-group">
              <label htmlFor="avatar-upload">Upload Avatar:</label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const processedImage = await removeBackground(file);
                      setPreviewAvatar(processedImage);
                      setBackgroundRemoved(true);
                    } catch (error) {
                      // Fallback to original image
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const result = e.target?.result as string;
                        setPreviewAvatar(result);
                        setBackgroundRemoved(false);
                      };
                      reader.readAsDataURL(file);
                    }
                  }
                }}
                className="pc-file-input"
              />
              <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                Background will be automatically removed
              </small>
            </div>

            <div className="pc-settings-actions">
              <button
                className="pc-save-btn"
                onClick={handleSaveChanges}
                type="button"
              >
                Save Changes
              </button>
              <button
                className="pc-cancel-btn"
                onClick={onToggleSettings}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);

export default ProfileCard;
