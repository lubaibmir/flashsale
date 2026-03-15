
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

export const TelemetryContext = createContext();

export const TelemetryProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [adminMetrics, setAdminMetrics] = useState({
    waitingCount: 0,
    stockRemaining: 10,
    ordersCount: 0
  });

  useEffect(() => {
    const newSocket = io('http://localhost:3003');
    setSocket(newSocket);

    newSocket.on('admin_update', (data) => {
        setAdminMetrics(prev => ({
            ...prev,
            ...data
        }));
    });

    return () => newSocket.close();
  }, []);

  return (
    <TelemetryContext.Provider value={{ socket, adminMetrics }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => useContext(TelemetryContext);
