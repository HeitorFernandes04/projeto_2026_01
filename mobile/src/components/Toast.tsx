import React from 'react';
import { IonToast } from '@ionic/react';

interface ToastProps {
  message: string;
  isOpen: boolean;
  onDidDismiss: () => void;
  color?: 'success' | 'danger' | 'warning' | 'primary';
}

const Toast: React.FC<ToastProps> = ({ message, isOpen, onDidDismiss, color = 'danger' }) => {
  return (
    <IonToast
      isOpen={isOpen}
      message={message}
      color={color}
      duration={3000}
      onDidDismiss={onDidDismiss}
      position="bottom"
      buttons={[{ text: 'OK', role: 'cancel' }]}
    />
  );
};

export default Toast;