import React, { useState, useEffect, useRef } from 'react';

const StickyButton = () => {
  const [isSticky, setIsSticky] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setIsSticky(rect.top <= 10); // When button top is 10px or less from viewport top
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      ref={buttonRef}
      className={`my-button ${isSticky ? 'fixed top-10 left-1/2 transform -translate-x-1/2 shadow-lg' : ''}`}
      style={{
        transition: 'all 0.3s ease',
        // initial styles here
      }}
    >
      Sticky Button
    </button>
  );
};

export default StickyButton;