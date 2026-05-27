import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="loading-screen">
    <div className="spinner" />
    <p>{message}</p>
  </div>
);

export default LoadingSpinner;
