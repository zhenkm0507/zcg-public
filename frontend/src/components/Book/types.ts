import React from 'react';

export interface BookProps {
  leftPage: React.ReactNode;
  rightPage: React.ReactNode;
  isFlipping: boolean;
  onFlipEnd?: () => void;
} 