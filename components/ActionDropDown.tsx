// Minimal, reliable version
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Menu } from 'react-native-paper';
import { Dialog } from './ui';

interface ActionsDropDownProps {
  onOpenOriginal: () => void;
  onShare: () => void;
  onDelete: () => Promise<{ success: boolean; error?: string }>;
}

const ActionsDropDown = ({ onOpenOriginal, onShare, onDelete }: ActionsDropDownProps) => {
  const [visible, setVisible] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ action: () => Promise<any>; title: string; message: string } | null>(null);
  const [notification, setNotification] = useState<{ visible: boolean; type: 'success' | 'error'; message: string }>({ visible: false, type: 'success', message: '' });

  const handleAction = async (actionFn: () => Promise<{ success: boolean; error?: string }>, actionName: string, confirm = false, confirmTitle = '', confirmMessage = '') => {
    setVisible(false);
    if (confirm) {
      setConfirmAction({ action: actionFn, title: confirmTitle, message: confirmMessage });
      setShowConfirmModal(true);
      return;
    }

    setLoadingAction(actionName);
    try {
      const result = await actionFn();
      if (result.success) setNotification({ visible: true, type: 'success', message: `${actionName} successful!` });
      else setNotification({ visible: true, type: 'error', message: result.error || `Failed to ${actionName}.` });
    } catch (err: any) {
      setNotification({ visible: true, type: 'error', message: err.message || `Failed to ${actionName}.` });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setShowConfirmModal(false);
    setLoadingAction(confirmAction.title);
    try {
      const result = await confirmAction.action();
      if (result.success) setNotification({ visible: true, type: 'success', message: `${confirmAction.title} successful!` });
      else setNotification({ visible: true, type: 'error', message: result.error || `Failed to ${confirmAction.title}.` });
    } catch (err: any) {
      setNotification({ visible: true, type: 'error', message: err.message || `Failed to ${confirmAction.title}.` });
    } finally {
      setLoadingAction(null);
      setConfirmAction(null);
    }
  };

  return (
    <View>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <TouchableOpacity onPress={() => setVisible(true)} style={styles.anchor}>
            {loadingAction ? <ActivityIndicator size="small" color="#232c38" /> : <Feather name="more-vertical" size={24} color="#232c38" />}
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <Menu.Item
          onPress={() => { setVisible(false); onOpenOriginal(); }}
          title="Open Original"
          leadingIcon={() => <MaterialCommunityIcons name="web" size={20} color="#232c38" />}
          disabled={!!loadingAction}
          titleStyle={{ color: '#232c38' }}
        />
        <Menu.Item
          onPress={() => { setVisible(false); onShare(); }}
          title="Share"
          leadingIcon={() => <Feather name="share-2" size={20} color="#232c38" />}
          disabled={!!loadingAction}
          titleStyle={{ color: '#232c38' }}
        />
        <Menu.Item
          onPress={() => handleAction(onDelete, 'Delete', true, 'Delete Save', 'Are you sure you want to delete this save permanently?')}
          title="Delete"
          leadingIcon={() => <AntDesign name="delete" size={20} color="#ef4444" />}
          titleStyle={{ color: '#ef4444' }}
          disabled={!!loadingAction}
        />
      </Menu>

      <Dialog
        visible={showConfirmModal}
        variant="confirmation"
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        onConfirm={handleConfirm}
        onCancel={() => { setShowConfirmModal(false); setConfirmAction(null); }}
        loading={!!loadingAction}
        onDismiss={() => { setShowConfirmModal(false); setConfirmAction(null); }}
      />

      <Dialog
        visible={notification.visible}
        variant="notification"
        type={notification.type}
        message={notification.message}
        onConfirm={() => setNotification({ visible: false, type: 'success', message: '' })}
        onDismiss={() => setNotification({ visible: false, type: 'success', message: '' })}
        confirmText="OK"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  anchor: { padding: 8 },
  menuContent: {
    borderRadius: 16,
    minWidth: 180,
    maxWidth: 200,
    backgroundColor: 'white',
    // let Paper handle placement — remove absolute, top/right
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ActionsDropDown;
