import { useRef, useState } from 'react';
import ModalDialog from '../../components/ModalDialog';
import { usePage } from '../../contexts/PageContext';
import { useSaveData } from '../../contexts/SaveDataContext';
import Page from '../../enums/Page';
import {
  addAreaStatus,
  addUser,
  deleteAreaStatuses,
  deleteUsers,
  moveAreaStatusDown,
  moveAreaStatusUp,
  updateAreaStatus,
  updateUser,
} from '../../logic/saveData';
import { exportSaveData, importSaveData } from '../../logic/storage';
import type { AreaStatusModel, UserDataModel } from '../../models';

const DEFAULT_STATUS_COLOR = '#81C784';

type UserModal = { user: UserDataModel };
type AreaStatusModal = { mode: 'add' } | { mode: 'edit'; status: AreaStatusModel };

export default function UserList() {
  const { saveData, setSaveData } = useSaveData();
  const { setPage } = usePage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedUserUuids, setSelectedUserUuids] = useState<Set<string>>(new Set());
  const [selectedStatusUuids, setSelectedStatusUuids] = useState<Set<string>>(new Set());
  const [userModal, setUserModal] = useState<UserModal | null>(null);
  const [areaStatusModal, setAreaStatusModal] = useState<AreaStatusModal | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editStatusName, setEditStatusName] = useState('');
  const [editStatusColor, setEditStatusColor] = useState(DEFAULT_STATUS_COLOR);
  const [importError, setImportError] = useState<string | null>(null);

  const users = saveData.userDataModels;
  const statuses = saveData.areaStatusModels;
  const singleSelectedStatus =
    selectedStatusUuids.size === 1
      ? statuses.find((s) => selectedStatusUuids.has(s.areaStatusUuid))
      : undefined;
  const singleSelectedStatusIndex = singleSelectedStatus
    ? statuses.indexOf(singleSelectedStatus)
    : -1;

  function toggleSetItem(setter: React.Dispatch<React.SetStateAction<Set<string>>>, uuid: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  }

  function toggleUserRow(uuid: string) {
    toggleSetItem(setSelectedUserUuids, uuid);
  }

  function handleAddUser() {
    setSaveData(addUser(saveData));
  }

  function handleOpenEditUser() {
    if (selectedUserUuids.size !== 1) return;
    const user = users.find((u) => selectedUserUuids.has(u.userUuid));
    if (!user) return;
    setEditUserName(user.userName);
    setUserModal({ user });
  }

  function handleSaveUser() {
    if (!userModal) return;
    setSaveData(updateUser(saveData, userModal.user.userUuid, editUserName));
    setUserModal(null);
  }

  function handleDeleteUsers() {
    setSaveData(deleteUsers(saveData, selectedUserUuids));
    setSelectedUserUuids(new Set());
  }

  function toggleStatusRow(uuid: string) {
    toggleSetItem(setSelectedStatusUuids, uuid);
  }

  function handleOpenAddStatus() {
    setEditStatusName('');
    setEditStatusColor(DEFAULT_STATUS_COLOR);
    setAreaStatusModal({ mode: 'add' });
  }

  function handleOpenEditStatus() {
    if (!singleSelectedStatus) return;
    setEditStatusName(singleSelectedStatus.areaStatusName);
    setEditStatusColor(singleSelectedStatus.areaStatusColor);
    setAreaStatusModal({ mode: 'edit', status: singleSelectedStatus });
  }

  function handleSaveStatus() {
    if (!areaStatusModal) return;
    if (areaStatusModal.mode === 'add') {
      setSaveData(addAreaStatus(saveData, { name: editStatusName, color: editStatusColor }));
    } else {
      setSaveData(
        updateAreaStatus(saveData, areaStatusModal.status.areaStatusUuid, {
          name: editStatusName,
          color: editStatusColor,
        }),
      );
    }
    setAreaStatusModal(null);
    setSelectedStatusUuids(new Set());
  }

  function handleDeleteStatuses() {
    setSaveData(deleteAreaStatuses(saveData, selectedStatusUuids));
    setSelectedStatusUuids(new Set());
  }

  function handleMoveUp() {
    if (!singleSelectedStatus) return;
    setSaveData(moveAreaStatusUp(saveData, singleSelectedStatus.areaStatusUuid));
  }

  function handleMoveDown() {
    if (!singleSelectedStatus) return;
    setSaveData(moveAreaStatusDown(saveData, singleSelectedStatus.areaStatusUuid));
  }

  function handleExport() {
    const json = exportSaveData(saveData);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visited-map-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importSaveData(text);
      if (result.ok) {
        if (confirm('現在のデータを上書きしますか？')) {
          setSaveData(result.data);
          setSelectedUserUuids(new Set());
          setSelectedStatusUuids(new Set());
        }
      } else {
        setImportError(result.error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗾</span>
            <h1 className="text-xl font-bold text-slate-800">訪問マップ</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span>↑</span> エクスポート
            </button>
            <button
              onClick={handleImportClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span>↓</span> インポート
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-6">
        {importError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {importError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">ユーザー</h2>
              <div className="flex items-center gap-1.5">
                <ActionButton onClick={handleAddUser} variant="primary">
                  追加
                </ActionButton>
                <ActionButton onClick={handleOpenEditUser} disabled={selectedUserUuids.size !== 1}>
                  編集
                </ActionButton>
                <ActionButton
                  onClick={handleDeleteUsers}
                  disabled={selectedUserUuids.size === 0}
                  variant="danger"
                >
                  削除
                </ActionButton>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                ユーザーがいません
              </div>
            ) : (
              <ul>
                {users.map((user) => {
                  const selected = selectedUserUuids.has(user.userUuid);
                  return (
                    <li
                      key={user.userUuid}
                      onClick={() => toggleUserRow(user.userUuid)}
                      className={`flex items-center px-5 py-3 cursor-pointer border-b border-slate-100 last:border-0 transition-colors select-none
                        ${selected ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-slate-50'}`}
                    >
                      <span
                        className={`flex-1 text-sm ${selected ? 'text-indigo-700 font-medium' : 'text-slate-700'}`}
                      >
                        {user.userName}
                      </span>
                      {selected && <span className="text-indigo-400 text-xs">✓</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold text-slate-700">訪問状態</h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                <ActionButton onClick={handleOpenAddStatus} variant="primary">
                  追加
                </ActionButton>
                <ActionButton onClick={handleOpenEditStatus} disabled={!singleSelectedStatus}>
                  編集
                </ActionButton>
                <ActionButton
                  onClick={handleDeleteStatuses}
                  disabled={selectedStatusUuids.size === 0}
                  variant="danger"
                >
                  削除
                </ActionButton>
                <ActionButton
                  onClick={handleMoveUp}
                  disabled={!singleSelectedStatus || singleSelectedStatusIndex === 0}
                  title="上に移動"
                >
                  ↑
                </ActionButton>
                <ActionButton
                  onClick={handleMoveDown}
                  disabled={
                    !singleSelectedStatus || singleSelectedStatusIndex === statuses.length - 1
                  }
                  title="下に移動"
                >
                  ↓
                </ActionButton>
              </div>
            </div>

            {statuses.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                訪問状態がありません
              </div>
            ) : (
              <ul>
                {statuses.map((status, index) => {
                  const selected = selectedStatusUuids.has(status.areaStatusUuid);
                  return (
                    <li
                      key={status.areaStatusUuid}
                      onClick={() => toggleStatusRow(status.areaStatusUuid)}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer border-b border-slate-100 last:border-0 transition-colors select-none
                        ${selected ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-slate-50'}`}
                    >
                      <span className="text-xs text-slate-300 w-4 text-right shrink-0">
                        {index + 1}
                      </span>
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: status.areaStatusColor }}
                      />
                      <span
                        className={`flex-1 text-sm ${selected ? 'text-indigo-700 font-medium' : 'text-slate-700'}`}
                      >
                        {status.areaStatusName}
                      </span>
                      {selected && <span className="text-indigo-400 text-xs">✓</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>

      <footer className="max-w-5xl w-full mx-auto px-6 pb-8 flex justify-end">
        <button
          onClick={() => setPage(Page.VisitedMap)}
          disabled={users.length === 0}
          className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          マップを開く <span>→</span>
        </button>
      </footer>

      <ModalDialog
        show={userModal !== null}
        title="ユーザー編集"
        onClose={() => setUserModal(null)}
        onSubmit={handleSaveUser}
      >
        <label htmlFor="edit-user-name" className="block text-sm font-medium text-slate-700 mb-1.5">
          名前
        </label>
        <input
          id="edit-user-name"
          type="text"
          value={editUserName}
          onChange={(e) => setEditUserName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveUser()}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          autoFocus
        />
      </ModalDialog>

      <ModalDialog
        show={areaStatusModal !== null}
        title={areaStatusModal?.mode === 'add' ? '訪問状態追加' : '訪問状態編集'}
        onClose={() => setAreaStatusModal(null)}
        onSubmit={handleSaveStatus}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="edit-status-name"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              名前
            </label>
            <input
              id="edit-status-name"
              type="text"
              value={editStatusName}
              onChange={(e) => setEditStatusName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveStatus()}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              autoFocus
            />
          </div>
          <div>
            <label
              htmlFor="edit-status-color"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              色
            </label>
            <div className="flex items-center gap-3">
              <input
                id="edit-status-color"
                type="color"
                value={editStatusColor}
                onChange={(e) => setEditStatusColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
              />
              <span className="text-sm text-slate-500 font-mono">{editStatusColor}</span>
            </div>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
  title?: string;
  children: React.ReactNode;
}

function ActionButton({
  onClick,
  disabled = false,
  variant = 'default',
  title,
  children,
}: ActionButtonProps) {
  const base =
    'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const styles = {
    default: 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50',
    primary: 'text-white bg-indigo-600 hover:bg-indigo-700',
    danger: 'text-red-600 bg-white border border-red-200 hover:bg-red-50',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
