import React, { useState, useRef, useEffect } from 'react';

const PriceSlider = () => {
  const [percent, setPercent] = useState(50); // Initial value at 50%
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const maxPrice = 1000;

  const calculateScroll = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    let offset = (clientX - rect.left) / rect.width;
    offset = Math.max(0, Math.min(1, offset)); // Clamp between 0 and 1
    setPercent(offset * 100);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    calculateScroll(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) calculateScroll(e.clientX);
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div style={styles.wrapper}>
      <div 
        style={styles.track} 
        ref={trackRef} 
        onMouseDown={handleMouseDown}
      >
        {/* Progress Bar (Black) */}
        <div style={{ ...styles.fill, width: `${percent}%` }} />
        
        {/* Draggable Thumb */}
        <div style={{ ...styles.thumb, left: `${percent}%` }} />
      </div>

      <div style={styles.label}>
        Price: <strong>${Math.round((percent / 100) * maxPrice)}</strong>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    width: '300px',
    padding: '40px 20px',
    background: '#fff',
    userSelect: 'none', // Prevents text selection while dragging
  },
  track: {
    position: 'relative',
    width: '100%',
    height: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  fill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#000',
    borderRadius: '3px',
    transition: 'width 0.1s ease-out',
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    width: '20px',
    height: '20px',
    backgroundColor: '#000',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    border: '2px solid #fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'left 0.1s ease-out',
    cursor: 'grab',
  },
  label: {
    marginTop: '20px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    textAlign: 'center',
  }
};

export default PriceSlider;