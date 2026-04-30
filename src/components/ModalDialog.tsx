interface ModalDialogProps {
  show: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
}

export default function ModalDialog({
  show,
  title,
  children,
  onClose,
  onSubmit,
}: ModalDialogProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h5 className="text-lg font-semibold">{title}</h5>
          <button
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded" onClick={onClose}>
            閉じる
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
            onClick={onSubmit}
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
