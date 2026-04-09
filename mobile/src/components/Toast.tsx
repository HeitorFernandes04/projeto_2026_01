import React, { useEffect, useState } from 'react';
import { IonToast } from '@ionic/react';

interface ToastProps {
  message: string;
  isOpen: boolean;
  onDidDismiss: () => void;
  color?: 'success' | 'danger' | 'warning' | 'primary';
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  isOpen, 
  onDidDismiss, 
  color = 'danger',
  duration = 3000 
}) => {
  return (
    <IonToast
      isOpen={isOpen}
      message={message}
      color={color}
      duration={duration}
      onDidDismiss={onDidDismiss}
      position="bottom"
      buttons={[
        {
          text: 'OK',
          role: 'cancel',
          handler: () => onDidDismiss()
        }
      ]}
    />
  );
};

export default Toast;
