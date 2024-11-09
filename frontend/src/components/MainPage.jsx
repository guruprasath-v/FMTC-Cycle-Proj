import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapImage from '../assets/map.jpeg';
import SA from '../assets/gps1.png';

const MainPage = () => {
  const navigate = useNavigate();

  // User state
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupDescription, setPopupDescription] = useState('');

  // Map state
  const [mapWidth, setMapWidth] = useState(0);
  const mapContainerRef = useRef(null);

  // Stand and cycle states
  const [selectedStand, setSelectedStand] = useState('');
  const [cycles, setCycles] = useState({});
  const [availableCount, setAvailableCount] = useState("");
  const [isCyclePopupVisible, setIsCyclePopupVisible] = useState(false);

  const stands = [
    { id: 1, name: 'Stand A', top: '25.6%', left: '15.9%', image: SA },
    { id: 2, name: 'Stand B', top: '39.7%', left: '54.5%', image: SA },
    { id: 3, name: 'Stand C', top: '76.9%', left: '24%', image: SA },
    { id: 4, name: 'Stand D', top: '15.6%', left: '45.9%', image: SA },
    { id: 5, name: 'Stand E', top: '59.7%', left: '74.5%', image: SA },
    { id: 6, name: 'Stand F', top: '76.9%', left: '54%', image: SA },
  ];

  const handleLogout = () => navigate('/login');

  const handleClose = () => {
    setIsCyclePopupVisible(false);
    setAvailableCount("");
    setCycles([]);
  };
  
  const handleStandClick = (standId) => setSelectedStand(standId.toString());
  
  const handleDropdownChange = (event) => setSelectedStand(event.target.value);

  // Adjust map width based on container size
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (mapContainerRef.current) setMapWidth(mapContainerRef.current.offsetWidth);
    });
    if (mapContainerRef.current) resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Fetch user booking status on component mount
  useEffect(() => {
    fetch(`http://localhost:8080/api/v1/users/main`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => {
        const { message, description } = data;
        if (message !== 'ok') {
          setPopupDescription(description);
          setIsPopupVisible(true);
        }
      })
      .catch(error => console.error("Error fetching user booking status:", error));
  }, []);

  // Fetch cycle details for the selected stand
  useEffect(() => {
    if (selectedStand) {
      const timer = setTimeout(() => {
        fetch(`http://localhost:8080/api/v1/stand/${selectedStand}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
          .then(response => response.json())
          .then(data => {
            const { message, available, cycles } = data;
            if (available === 0) {
              setPopupDescription(message || 'No cycles available at this stand.');
              setIsCyclePopupVisible(true);
            } else if (available > 0) {
              setCycles(cycles);
              setAvailableCount(cycles.length);
              setIsCyclePopupVisible(true);
            }
          })
          .catch(error => console.error("Error fetching cycle availability:", error));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedStand]);

  const handleUnlockClick = (cycleName) => {
    fetch(`http://localhost:8080/api/v1/cycle/${cycleName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => response.json())
      .then(data => {
        const { message, description } = data;
        setPopupDescription(
          message === 'success'
            ? `Cycle ${cycleName} unlocked successfully!`
            : `Failed to unlock cycle ${cycleName}. ${description}`
        );
        setIsCyclePopupVisible(true);
      })
      .catch(error => {
        setPopupDescription('An error occurred while unlocking the cycle.');
        setIsCyclePopupVisible(true);
      });
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh',
      padding: '20px', position: 'relative', backgroundColor: '#ffffff'
    }}>
      
      {/* Logout Button */}
      <button onClick={handleLogout} style={{
        position: 'absolute', top: '20px', right: '20px', backgroundColor: '#ff4b5c',
        color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 12px', cursor: 'pointer'
      }}>Logout</button>

      <h1 style={{ marginTop: '40px', textAlign: 'center', color: '#333' }}>Welcome user!</h1>
      <p style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>Please choose the preferred stand and cycle below!</p>

      {/* Map container with responsive sizing */}
      <div ref={mapContainerRef} style={{
        position: 'relative', width: '70vw', maxWidth: '700px', marginTop: '20px',
        backgroundColor: 'white', borderRadius: '8px', border: '2px solid black',
        overflow: 'hidden', height: 'auto'
      }}>
        <img src={mapImage} alt="College Map" style={{
          width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px'
        }} />

        {/* Stand Placeholders */}
        {stands.map((stand) => {
          const placeholderSize = mapWidth * 0.14;
          const isSelected = selectedStand === stand.id.toString();
          return (
            <div key={stand.id} onClick={() => handleStandClick(stand.id)} style={{
              position: 'absolute', top: stand.top, left: stand.left,
              width: `${placeholderSize}px`, height: `${placeholderSize}px`, cursor: 'pointer',
              transform: 'translate(-50%, -50%)', display: 'flex', justifyContent: 'center', alignItems: 'center',
              border: isSelected ? '3px solid green' : 'none', borderRadius: '8px',
              // boxShadow: isSelected ? '0px 0px 5px 1px green' : 'none',
            }}>
              <img src={stand.image} alt={stand.name} onClick={(e) => {
                e.stopPropagation(); handleStandClick(stand.id);
              }} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} />
              <span style={{
                position: 'absolute', top: '-35px', fontSize: 'clamp(12px, 2vw, 18px)', color: '#333',
                width: '160%', backgroundColor: '#fff', padding: '2px 6px', borderRadius: '4px',
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)', pointerEvents: 'none',
              }}>{stand.name}</span>
            </div>
          );
        })}
      </div>

      {/* Dropdown menu */}
      <select value={selectedStand} onChange={handleDropdownChange} style={{
        marginTop: '20px', padding: '5px', fontSize: '12px', borderRadius: '4px',
        border: '1px solid #ccc', width: '25%', maxWidth: '200px', textAlign: 'center'
      }}>
        <option value="" disabled>Select</option>
        {stands.map((stand) => (
          <option key={stand.id} value={stand.id}>{stand.name}</option>
        ))}
      </select>

      {/* User booking popup */}
      {isPopupVisible && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
          padding: '20px', zIndex: 1000, maxWidth: '200px'
        }}>
          <h2 style={{ marginBottom: '10px', color: '#333' }}>Alert</h2>
          <p style={{
            color: '#666', maxWidth: '200px', wordWrap: 'break-word',
            overflowWrap: 'break-word', textAlign: 'center', margin: '10px 0'
          }}>{popupDescription}</p>
          <button onClick={() => navigate('/booking')} style={{
            backgroundColor: '#ff4b5c', color: '#fff', border: 'none', borderRadius: '4px',
            padding: '8px 12px', cursor: 'pointer', marginTop: '10px', width: '100%'
          }}>OK</button>
        </div>
      )}

      {/* Cycle availability popup */}
      {isCyclePopupVisible && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
          padding: '20px', zIndex: 1000, maxWidth: '400px'
        }}>
          <h2 style={{ marginBottom: '10px', color: '#333' }}>{selectedStand}</h2>
          <p style={{ color: '#666', textAlign: 'center', fontSize: 'clamp(10px, 2vw, 14px)' }}>
            {availableCount ? `Available Cycles: ${availableCount}` : 'No cycles available at this stand.'}
          </p>
          <ul style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', padding: 0,
            listStyle: 'none', gap: '10px', fontSize: 'clamp(12px, 2vw, 16px)'
          }}>
            {Object.entries(cycles).map(([cycleId, cycleName]) => (
              <li key={cycleId} onClick={() => handleUnlockClick(cycleName)} style={{
                backgroundColor: '#ff4b5c', color: '#fff', border: 'none', borderRadius: '4px',
                padding: '8px 12px', cursor: 'pointer', minWidth: '40%', textAlign: 'center'
              }}>{'C' + cycleName}</li>
            ))}
          </ul>
          <button onClick={handleClose} style={{
            backgroundColor: '#ccc', color: '#333', border: 'none', borderRadius: '4px',
            padding: '8px 12px', cursor: 'pointer', marginTop: '10px', width: '100%'
          }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default MainPage;
