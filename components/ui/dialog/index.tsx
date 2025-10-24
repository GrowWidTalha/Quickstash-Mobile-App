import React from 'react';
import { Text, View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { Portal, Button } from 'react-native-paper';
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
  const isDelete = type === 'error' || confirmText.toLowerCase().includes('delete');

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

  // For confirmation, use app's destructive (red) for delete variant, fallback to blue
  const getConfirmButtonStyle = () => {
    if (variant === 'confirmation' && isDelete) {
      return [
        dialogAppStyles.button,
        dialogAppStyles.deleteButton,
      ];
    }
    if (variant === 'confirmation') {
      return [
        dialogAppStyles.button,
        dialogAppStyles.confirmButton,
      ];
    }
    if (variant === 'notification') {
      return [
        dialogAppStyles.button,
        { backgroundColor: variantColors[type] }
      ];
    }
    return [
      dialogAppStyles.button,
    ];
  };

  const renderContent = () => {
    // LOADING
    if (variant === 'loading') {
      return (
        <View style={dialogAppStyles.body}>
          <View style={dialogAppStyles.header}>
            {title ? <Text style={dialogAppStyles.title}>{title}</Text> : null}
          </View>
          <View style={dialogAppStyles.centerContent}>
            <ActivityIndicator size="large" color="#1e88e5" style={{ marginBottom: 12 }} />
            {message && <Text style={dialogAppStyles.message}>{message}</Text>}
          </View>
        </View>
      );
    }
    // PROGRESS
    if (variant === 'progress') {
      return (
        <View style={dialogAppStyles.body}>
          <View style={dialogAppStyles.header}>
            {title ? <Text style={dialogAppStyles.title}>{title}</Text> : null}
          </View>
          {message && (
            <Text style={dialogAppStyles.message}>{message}</Text>
          )}
          <View style={dialogAppStyles.progressContainer}>
            <View style={dialogAppStyles.progressBar}>
              <View
                style={[
                  dialogAppStyles.progressFill,
                  { width: `${Math.min(100, Math.max(0, progress))}%` }
                ]}
              />
            </View>
            {progressText && (
              <Text style={dialogAppStyles.progressText}>{progressText}</Text>
            )}
          </View>
        </View>
      );
    }

    // CONFIRMATION, NOTIFICATION, INFO
    return (
      <View style={dialogAppStyles.body}>
        {/* Header row */}
        <View style={dialogAppStyles.header}>
          {title && (
            <Text style={dialogAppStyles.title} numberOfLines={2} ellipsizeMode="tail">
              {title}
            </Text>
          )}
        </View>
        {/* Description/message */}
        {message ? (
          <Text style={dialogAppStyles.message}>{message}</Text>
        ) : null}

        {/* Notification/Info Icon */}
        {(variant === 'notification' || variant === 'info') && (
          <View style={dialogAppStyles.iconRow}>
            <Feather
              name={getIconName() as any}
              size={32}
              color={getIconColor()}
            />
          </View>
        )}

        {/* Actions fixed to bottom */}
        {(variant === 'confirmation' || variant === 'notification' || variant === 'info') && (
          <View style={dialogAppStyles.actions}>
            {variant === 'confirmation' && onCancel && (
              <Button
                // mode="outlined"
                onPress={onCancel}
                disabled={loading}
                style={[dialogAppStyles.button, dialogAppStyles.cancelButton]}
                labelStyle={{ color: '#000' }}
                contentStyle={dialogAppStyles.buttonContent}
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
                style={type === 'error' || confirmText.toLowerCase().includes('delete') ? dialogAppStyles.deleteButton : getConfirmButtonStyle()}
                labelStyle={dialogAppStyles.buttonLabel}
                contentStyle={dialogAppStyles.buttonContent}
              >
                <Text style={dialogAppStyles.buttonLabel}>{confirmText}</Text>
              </Button>
            )}
          </View>
        )}
      </View>
    );
  };

  // Use minimal and consistent padding, header on top, actions stick to bottom
  return (
    <Portal>
      <Modal
        animationType="fade"
        transparent
        visible={visible}
        onRequestClose={onDismiss}
      >
        <View style={styles.modalBackdrop}>
          <View style={dialogAppStyles.root}>
            {renderContent()}
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const dialogAppStyles = StyleSheet.create({
  root: {
    minWidth: 300,
    maxWidth: 400,
    width: '90%',
    borderRadius: 14,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowRadius: 14,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 5 },
    padding: 0,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    minHeight: 140,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  header: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#23272c',
    flexShrink: 1
  },
  message: {
    marginTop: 8,
    fontSize: 15,
    color: '#41464d',
    lineHeight: 22,
    marginBottom: 12,
  },
  iconRow: {
    marginTop: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingBottom: 2,
    marginTop: 18,
  },
  button: {
    flex: 0,
    minWidth: 100,
    borderRadius: 8,
    elevation: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 0,
    backgroundColor: '#1e88e5',
    height: 42,
  },
  buttonContent: {
    height: 42,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'none',
    color: '#fff'
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e7',
    marginRight: 8,
    elevation: 0,
    minWidth: 100,
    height: 42,
  },
  confirmButton: {
    backgroundColor: '#1777F2',
    minWidth: 100,
    elevation: 0,
    height: 42,
  },
  deleteButton: {
    backgroundColor: '#E53935', // app error red
    minWidth: 100,
    height: 42,
    elevation: 0,
  },
  progressContainer: {
    marginTop: 18,
    marginBottom: 2,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  progressBar: {
    height: 7,
    backgroundColor: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: 7,
    borderRadius: 6,
    backgroundColor: '#1e88e5',
  },
  progressText: {
    fontSize: 13,
    textAlign: 'right',
    marginTop: 4,
    color: '#888',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default Dialog;
