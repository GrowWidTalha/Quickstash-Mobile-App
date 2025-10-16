import { StyleSheet } from 'react-native';

export const dialogStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: 'white',
    padding: 20,
    maxWidth: 400,
    width: '90%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232c38',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#1e88e5',
  },
  successButton: {
    backgroundColor: '#22c55e',
  },
  errorButton: {
    backgroundColor: '#ef4444',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  infoButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#374151',
  },
  confirmButtonText: {
    color: 'white',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1e88e5',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

export const variantColors = {
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
} as const;

export const variantIcons = {
  success: 'check-circle',
  error: 'x-circle',
  warning: 'alert-triangle',
  info: 'info',
} as const;
