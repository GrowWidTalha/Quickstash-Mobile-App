import { Text } from "react-native";
import { Portal } from "react-native-paper";
import { Dialog } from "./ui/dialog";
interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}

const ConfirmationModal = ({ visible, title, message, onConfirm, onCancel, loading }: ConfirmationModalProps) => (
        <Dialog visible={visible} onDismiss={onCancel} confirmText="Delete" cancelText="Cancel" type="error" variant="confirmation" title={title} message={message} onConfirm={onConfirm} onCancel={onCancel} loading={loading} />
)

export default ConfirmationModal
