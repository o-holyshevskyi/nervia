import { X } from 'lucide-react';

interface CloseButtonProps {
    onClose: () => void;
    size?: number;
}

const CloseButton = ({ onClose, size = 24 }: CloseButtonProps) => <button 
    onClick={onClose}
    className="hover:cursor-pointer top-6 right-6 text-neutral-400 hover:text-white transition-colors"
>
    <X size={size} />
</button>;

export default CloseButton;
