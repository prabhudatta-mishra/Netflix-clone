import React from 'react';

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton shimmer" style={{ height: '140px' }} />
    <div className="skeleton shimmer" style={{ height: '16px', width: '70%', marginTop: '12px' }} />
    <div className="skeleton shimmer" style={{ height: '12px', width: '50%', marginTop: '8px' }} />
  </div>
);

export const SkeletonHero = () => (
  <div className="skeleton-hero shimmer" />
);

export const SkeletonRow = ({ count = 6 }) => (
  <div className="skeleton-row">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-carousel-item shimmer" />
    ))}
  </div>
);

