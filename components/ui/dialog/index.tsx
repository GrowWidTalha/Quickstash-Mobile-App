import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { Portal, Dialog as PaperDialog, Button } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { dialogStyles, variantColors, variantIcons } from './styles';

export interface DialogProps {
  visible: boolean;
  onDismiss: () => void;
  variant: 'confirmation' | 'notification' | 'info' | 'loading' | 'progress';
  title?: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  progress?: number;
  progressText?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  visible,
  onDismiss,
  variant,
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  progress = 0,
  progressText,
}) => {
  const getIconName = () => {
    if (variant === 'notification') {
      return variantIcons[type];
    }
    return 'info';
  };

  const getIconColor = () => {
    if (variant === 'notification') {
      return variantColors[type];
    }
    return variantColors.info;
  };

  const getButtonStyle = () => {
    if (variant === 'notification') {
      return {
        backgroundColor: variantColors[type],
        ...dialogStyles.button,
      };
    }
    return {
      backgroundColor: '#1e88e5',
      ...dialogStyles.button,
    };
  };

  const renderContent = () => {
    if (variant === 'loading') {
      return (
        <View style={dialogStyles.container}>
          <View style={dialogStyles.iconContainer}>
            <ActivityIndicator size="large" color="#1e88e5" />
          </View>
          {title && <Text style={dialogStyles.title}>{title}</Text>}
          {message && <Text style={dialogStyles.message}>{message}</Text>}
        </View>
      );
    }

    if (variant === 'progress') {
      return (
        <View style={dialogStyles.container}>
          {title && <Text style={dialogStyles.title}>{title}</Text>}
          {message && <Text style={dialogStyles.message}>{message}</Text>}
          <View style={dialogStyles.progressContainer}>
            <View style={dialogStyles.progressBar}>
              <View 
                style={[
                  dialogStyles.progressFill,
                  { width: `${Math.min(100, Math.max(0, progress))}%` }
                ]} 
              />
            </View>
            {progressText && (
              <Text style={dialogStyles.progressText}>{progressText}</Text>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={dialogStyles.container}>
        {(variant === 'notification' || variant === 'info') && (
          <View style={dialogStyles.iconContainer}>
            <Feather 
              name={getIconName() as any} 
              size={32} 
              color={getIconColor()} 
            />
          </View>
        )}
        {title && <Text style={dialogStyles.title}>{title}</Text>}
        {message && <Text style={dialogStyles.message}>{message}</Text>}
        
        {variant !== 'loading' && variant !== 'progress' && (
          <View style={dialogStyles.actions}>
            {variant === 'confirmation' && onCancel && (
              <Button
                mode="outlined"
                onPress={onCancel}
                disabled={loading}
                style={[dialogStyles.button, dialogStyles.cancelButton]}
                labelStyle={[dialogStyles.buttonText, dialogStyles.cancelButtonText]}
              >
                {cancelText}
              </Button>
            )}
            {onConfirm && (
              <Button
                mode="contained"
                onPress={onConfirm}
                loading={loading}
                disabled={loading}
                style={getButtonStyle()}
                labelStyle={[dialogStyles.buttonText, dialogStyles.confirmButtonText]}
              >
                {confirmText}
              </Button>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Portal>
      <PaperDialog visible={visible} onDismiss={onDismiss}>
        {renderContent()}
      </PaperDialog>
    </Portal>
  );
};

export default Dialog;
