import { Text } from "react-native";
import { Button, Dialog, Portal } from "react-native-paper";
interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}

const ConfirmationModal = ({ visible, title, message, onConfirm, onCancel, loading }: ConfirmationModalProps) => (
    <Portal>
        <Dialog visible={visible} onDismiss={onCancel} style={{ borderRadius: 16, backgroundColor: 'white', padding: 16 }}>
            <Dialog.Title style={{ fontSize: 18, fontWeight: 'bold', color: '#232c38' }}>{title}</Dialog.Title>
            <Dialog.Content>
                <Text style={{ fontSize: 16, color: '#4b5563' }}>{message}</Text>
            </Dialog.Content>
            <Dialog.Actions style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Button onPress={onCancel} disabled={loading} labelStyle={{ color: '#ef4444' }}>Cancel</Button>
                <Button onPress={onConfirm} loading={loading} disabled={loading} labelStyle={{ color: '#22c55e' }}>Confirm</Button>
            </Dialog.Actions>
        </Dialog>
    </Portal>
)

export default ConfirmationModal
