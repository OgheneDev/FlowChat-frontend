import ForwardModal from '@/components/chat/window/message-actions/ForwardModal';

const ForwardModalWrapper = ({ isOpen, messages, onForward, onClose }: any) => (
  <ForwardModal
    isOpen={isOpen}
    onClose={onClose}
    messages={messages}
    onForward={onForward}
    isBulk={true}
  />
);

export default ForwardModalWrapper;