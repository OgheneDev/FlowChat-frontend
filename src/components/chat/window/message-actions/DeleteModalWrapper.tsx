import DeleteModal from '@/components/chat/window/message-actions/DeleteModal';

const DeleteModalWrapper = ({ modal, isOwn, onDelete, onClose }: any) => {
  if (!modal) return null;
  return (
    <DeleteModal
      message={modal.message}
      deleteType={modal.deleteType}
      onDelete={onDelete}
      onClose={onClose}
      isSendingMessage={false}
      isOwn={isOwn}
    />
  );
};

export default DeleteModalWrapper;