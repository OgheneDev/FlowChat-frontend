import DeleteModal from '@/components/modals/DeleteModal';

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