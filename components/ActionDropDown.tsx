import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';
import { Menu } from 'react-native-paper';
import ConfirmationModal from './ConfirmationDialog';

interface ActionsDropDownProps {
    onOpenOriginal: () => void;
    onMarkAsRead: () => Promise<{ success: boolean; error?: string }>;
    onMarkAsUnread: () => Promise<{ success: boolean; error?: string }>;
    onArchive: () => Promise<{ success: boolean; error?: string }>;
    onUnarchive: () => Promise<{ success: boolean; error?: string }>;
    onShare: () => void;
    onDelete: () => Promise<{ success: boolean; error?: string }>;
    isRead: boolean;
    isArchived: boolean;
}

const ActionsDropDown = ({
    onOpenOriginal,
    onMarkAsRead,
    onMarkAsUnread,
    onArchive,
    onUnarchive,
    onShare,
    onDelete,
    isRead,
    isArchived,
}: ActionsDropDownProps) => {
    const [visible, setVisible] = useState(false)
    const [loadingAction, setLoadingAction] = useState<string | null>(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{ action: () => Promise<any>, title: string, message: string } | null>(null)

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
            if (result.success) {
                Alert.alert('Success', `${actionName} successful!`);
            } else {
                Alert.alert('Error', result.error || `Failed to ${actionName}.`);
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || `Failed to ${actionName}.`);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleConfirm = async () => {
        if (confirmAction) {
            setShowConfirmModal(false);
            setLoadingAction(confirmAction.title); // Use title as action name for loading
            try {
                const result = await confirmAction.action();
                if (result.success) {
                    Alert.alert('Success', `${confirmAction.title} successful!`);
                } else {
                    Alert.alert('Error', result.error || `Failed to ${confirmAction.title}.`);
                }
            } catch (err: any) {
                Alert.alert('Error', err.message || `Failed to ${confirmAction.title}.`);
            } finally {
                setLoadingAction(null);
                setConfirmAction(null);
            }
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    return (
        <View>
            <Menu
                visible={visible}
                onDismiss={() => setVisible(false)}
                anchor={
                    <TouchableOpacity onPress={() => setVisible(true)} className="p-2">
                        {loadingAction ? (
                            <ActivityIndicator size="small" color="#232c38" />
                        ) : (
                            <Feather name="more-vertical" size={24} color="#232c38" />
                        )}
                    </TouchableOpacity>
                }
                contentStyle={{ borderRadius: 16, minWidth: 180, backgroundColor: 'white' }}
            >
                <Menu.Item
                    onPress={() => { setVisible(false); onOpenOriginal() }}
                    title="Open Original"
                    leadingIcon={() => <MaterialCommunityIcons name="web" size={20} color="#232c38" />}
                    disabled={!!loadingAction}
                    titleStyle={{ color: '#232c38' }}
                />
                {isRead ? (
                    <Menu.Item
                        onPress={() => handleAction(onMarkAsUnread, 'Mark as Unread')}
                        title="Mark as Unread"
                        leadingIcon={() => <Feather name="circle" size={20} color="#232c38" />}
                        disabled={!!loadingAction}
                        titleStyle={{ color: '#232c38' }}
                    />
                ) : (
                    <Menu.Item
                        onPress={() => handleAction(onMarkAsRead, 'Mark as Read')}
                        title="Mark as Read"
                        leadingIcon={() => <Feather name="check-circle" size={20} color="#232c38" />}
                        disabled={!!loadingAction}
                        titleStyle={{ color: '#232c38' }}
                    />
                )}
                {isArchived ? (
                    <Menu.Item
                        onPress={() => handleAction(onUnarchive, 'Unarchive', true, 'Unarchive Save', 'Are you sure you want to unarchive this save?')}
                        title="Unarchive"
                        leadingIcon={() => <Feather name="box" size={20} color="#232c38" />}
                        disabled={!!loadingAction}
                        titleStyle={{ color: '#232c38' }}
                    />
                ) : (
                    <Menu.Item
                        onPress={() => handleAction(onArchive, 'Archive', true, 'Archive Save', 'Are you sure you want to archive this save?')}
                        title="Archive"
                        leadingIcon={() => <Feather name="archive" size={20} color="#232c38" />}
                        disabled={!!loadingAction}
                        titleStyle={{ color: '#232c38' }}
                    />
                )}
                <Menu.Item
                    onPress={() => { setVisible(false); onShare() }}
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
            <ConfirmationModal
                visible={showConfirmModal}
                title={confirmAction?.title || ''}
                message={confirmAction?.message || ''}
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirm}
                loading={!!loadingAction}
            />
        </View>
    )
}
export default ActionsDropDown