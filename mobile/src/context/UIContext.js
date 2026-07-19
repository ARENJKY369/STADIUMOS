import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const [bottomSheet, setBottomSheet] = useState(null);

  const showLoading = (message = 'Loading...') => {
    setLoading({ visible: true, message });
  };

  const hideLoading = () => {
    setLoading(false);
  };

  const showModal = (component, options = {}) => {
    setModal({ component, options });
  };

  const hideModal = () => {
    setModal(null);
  };

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    const toast = { id, message, type, duration };
    setToastQueue(prev => [...prev, toast]);
    setTimeout(() => {
      setToastQueue(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const showBottomSheet = (content, options = {}) => {
    setBottomSheet({ content, options });
  };

  const hideBottomSheet = () => {
    setBottomSheet(null);
  };

  return (
    <UIContext.Provider value={{
      loading, showLoading, hideLoading,
      modal, showModal, hideModal,
      toastQueue, showToast,
      bottomSheet, showBottomSheet, hideBottomSheet,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUIContext() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUIContext must be used within UIProvider');
  return ctx;
}
