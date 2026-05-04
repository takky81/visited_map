import { useEffect, useRef, useState } from 'react';
import ModalDialog from '../../components/ModalDialog';
import { useSaveData } from '../../contexts/SaveDataContext';
import {
  addAreaStatus,
  addUser,
  cycleAreaStatus,
  deleteAreaStatuses,
  deleteUsers,
  getAreaStatus,
  moveAreaStatusDown,
  moveAreaStatusUp,
  updateAreaStatus,
  updateUser,
} from '../../logic/saveData';
import { exportSaveData, importSaveData } from '../../logic/storage';
import type { AreaStatusModel, SaveDataModel, UserDataModel } from '../../models';
import mapFullRaw from '../../mapDatas/map-full.svg?raw';
import mapMobileRaw from '../../mapDatas/map-mobile.svg?raw';

const UNVISITED_COLOR = '#f1f5f9';
const DEFAULT_STATUS_COLOR = '#81C784';
const COMPARE_LABELS = ['左', '右'] as const;

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

function userActionBtnCls(isSelected: boolean) {
  return `shrink-0 w-5 h-5 flex items-center justify-center rounded text-xs transition-colors ${
    isSelected
      ? 'text-indigo-200 hover:text-white hover:bg-indigo-500'
      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'
  }`;
}

interface ComparePopup {
  x: number;
  y: number;
  areaId: string;
}

type UserModal = { user: UserDataModel };
type AreaStatusModal = { mode: 'add' } | { mode: 'edit'; status: AreaStatusModel };

export default function VisitedMap() {
  const { saveData, setSaveData } = useSaveData();
  const mapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [selectedUserUuids, setSelectedUserUuids] = useState<string[]>([]);
  const [comparePopup, setComparePopup] = useState<ComparePopup | null>(null);
  const [showNoUserDialog, setShowNoUserDialog] = useState(false);

  const [userModal, setUserModal] = useState<UserModal | null>(null);
  const [areaStatusModal, setAreaStatusModal] = useState<AreaStatusModal | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editStatusName, setEditStatusName] = useState('');
  const [editStatusColor, setEditStatusColor] = useState(DEFAULT_STATUS_COLOR);
  const [importError, setImportError] = useState<string | null>(null);
  const [importConfirmData, setImportConfirmData] = useState<SaveDataModel | null>(null);

  const isCompareMode = selectedUserUuids.length === 2;
  const mapSvg = isMobile ? mapMobileRaw : mapFullRaw;
  const statuses = saveData.areaStatusModels;

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;
    container.innerHTML = mapSvg;
    const svg = container.querySelector('svg');
    if (!svg) return;
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';
    svg.querySelectorAll<SVGElement>('[data-code]').forEach((path) => {
      path.style.stroke = '#cbd5e1';
      path.style.strokeWidth = '0.5';
      path.style.transition = 'fill 0.15s ease';
    });
  }, [mapSvg]);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;
    const svg = container.querySelector('svg');
    if (!svg) return;

    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    const statusColorById = new Map(
      saveData.areaStatusModels.map((s) => [s.areaStatusUuid, s.areaStatusColor]),
    );
    const buildAreaColors = (userUuid: string): Map<string, string> => {
      const user = saveData.userDataModels.find((u) => u.userUuid === userUuid);
      const map = new Map<string, string>();
      user?.mapDataModels.forEach((m) => {
        map.set(m.areaId, statusColorById.get(m.areaStatusUuid) ?? UNVISITED_COLOR);
      });
      return map;
    };

    const paths = svg.querySelectorAll<SVGElement>('[data-code]');

    if (isCompareMode) {
      defs.querySelectorAll('[id^="vg-"]').forEach((el) => el.remove());
      const [uuid1, uuid2] = selectedUserUuids;
      const colors1 = buildAreaColors(uuid1);
      const colors2 = buildAreaColors(uuid2);
      paths.forEach((path) => {
        const areaId = path.getAttribute('data-code');
        if (!areaId) return;
        const c1 = colors1.get(areaId) ?? UNVISITED_COLOR;
        const c2 = colors2.get(areaId) ?? UNVISITED_COLOR;
        const gradId = `vg-${areaId}`;
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', gradId);
        grad.setAttribute('x1', '0');
        grad.setAttribute('y1', '0');
        grad.setAttribute('x2', '1');
        grad.setAttribute('y2', '0');
        grad.setAttribute('gradientUnits', 'objectBoundingBox');
        const stops: [string, string][] = [
          ['0%', c1],
          ['50%', c1],
          ['50%', c2],
          ['100%', c2],
        ];
        stops.forEach(([offset, color]) => {
          const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
          stop.setAttribute('offset', offset);
          stop.setAttribute('stop-color', color);
          grad.appendChild(stop);
        });
        defs!.appendChild(grad);
        path.style.fill = `url(#${gradId})`;
        path.style.cursor = 'pointer';
      });
    } else {
      if (defs.querySelector('[id^="vg-"]')) {
        defs.querySelectorAll('[id^="vg-"]').forEach((el) => el.remove());
      }
      if (selectedUserUuids.length === 1) {
        const colors = buildAreaColors(selectedUserUuids[0]);
        paths.forEach((path) => {
          const areaId = path.getAttribute('data-code');
          if (!areaId) return;
          path.style.fill = colors.get(areaId) ?? UNVISITED_COLOR;
          path.style.cursor = 'pointer';
        });
      } else {
        paths.forEach((path) => {
          path.style.fill = UNVISITED_COLOR;
          path.style.cursor = 'default';
        });
      }
    }
  }, [saveData, selectedUserUuids, isCompareMode, mapSvg]);

  function handleMapClick(e: React.MouseEvent) {
    const target = (e.target as SVGElement).closest<SVGElement>('[data-code]');
    if (!target) {
      setComparePopup(null);
      return;
    }
    const areaId = target.getAttribute('data-code');
    if (!areaId) return;

    if (isCompareMode) {
      e.stopPropagation();
      const rect = mapRef.current!.getBoundingClientRect();
      setComparePopup({ x: e.clientX - rect.left, y: e.clientY - rect.top, areaId });
      return;
    }

    if (selectedUserUuids.length === 1) {
      setSaveData((prev) => cycleAreaStatus(prev, selectedUserUuids[0], areaId));
    } else {
      setShowNoUserDialog(true);
    }
  }

  function toggleUser(uuid: string) {
    setComparePopup(null);
    setSelectedUserUuids((prev) => {
      if (prev.includes(uuid)) return prev.filter((u) => u !== uuid);
      if (prev.length >= 2) return [prev[1], uuid];
      return [...prev, uuid];
    });
  }

  function handleAddUser() {
    setSaveData((prev) => addUser(prev));
  }

  function handleOpenEditUser(user: UserDataModel) {
    setEditUserName(user.userName);
    setUserModal({ user });
  }

  function handleSaveUser() {
    if (!userModal) return;
    setSaveData((prev) => updateUser(prev, userModal.user.userUuid, editUserName));
    setUserModal(null);
  }

  function handleDeleteUser(uuid: string) {
    setSaveData((prev) => deleteUsers(prev, new Set([uuid])));
    setSelectedUserUuids((prev) => prev.filter((u) => u !== uuid));
  }

  function handleOpenAddStatus() {
    setEditStatusName('');
    setEditStatusColor(DEFAULT_STATUS_COLOR);
    setAreaStatusModal({ mode: 'add' });
  }

  function handleOpenEditStatus(status: AreaStatusModel) {
    setEditStatusName(status.areaStatusName);
    setEditStatusColor(status.areaStatusColor);
    setAreaStatusModal({ mode: 'edit', status });
  }

  function handleSaveStatus() {
    if (!areaStatusModal) return;
    if (areaStatusModal.mode === 'add') {
      setSaveData((prev) => addAreaStatus(prev, { name: editStatusName, color: editStatusColor }));
    } else {
      setSaveData((prev) =>
        updateAreaStatus(prev, areaStatusModal.status.areaStatusUuid, {
          name: editStatusName,
          color: editStatusColor,
        }),
      );
    }
    setAreaStatusModal(null);
  }

  function handleDeleteStatus(uuid: string) {
    setSaveData((prev) => deleteAreaStatuses(prev, new Set([uuid])));
  }

  function handleConfirmImport() {
    if (!importConfirmData) return;
    setSaveData(importConfirmData);
    setSelectedUserUuids([]);
    setImportConfirmData(null);
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
        setImportConfirmData(result.data);
      } else {
        setImportError(result.error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-900 flex flex-col relative">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <span className="text-sm font-semibold text-white">🗾 訪問マップ</span>
        {isCompareMode && (
          <span className="px-2 py-0.5 text-xs font-medium text-indigo-300 bg-indigo-900/50 rounded-full border border-indigo-700">
            比較モード
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {importError && (
            <span className="text-xs text-red-400 mr-2 max-w-40 truncate">{importError}</span>
          )}
          <button
            onClick={handleImportClick}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            インポート
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            エクスポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </header>

      <div className="flex flex-col-reverse md:flex-row flex-1 overflow-hidden">
        <div
          className="flex-1 relative overflow-hidden bg-slate-900"
          onClick={() => setComparePopup(null)}
        >
          <div ref={mapRef} className="w-full h-full" onClick={handleMapClick} />

          {comparePopup && isCompareMode && (
            <ComparePopupCard
              popup={comparePopup}
              saveData={saveData}
              selectedUserUuids={selectedUserUuids}
              onClose={() => setComparePopup(null)}
            />
          )}
        </div>

        <aside className="shrink-0 bg-slate-800 border-t border-slate-700 md:border-t-0 md:border-l flex flex-row md:flex-col md:w-64 overflow-hidden">
          <div className="flex-1 md:flex-none px-3 py-2 md:px-4 md:pt-4 md:pb-3 border-r border-slate-700 md:border-r-0 md:border-b overflow-y-auto">
            <SidebarSectionHeader
              label="ユーザー"
              onAdd={handleAddUser}
              addTitle="ユーザーを追加"
            />
            {saveData.userDataModels.length === 0 ? (
              <p className="text-xs text-slate-500">ユーザーがいません</p>
            ) : (
              <ul className="space-y-1">
                {saveData.userDataModels.map((user) => {
                  const idx = selectedUserUuids.indexOf(user.userUuid);
                  const isSelected = idx !== -1;
                  const label = isCompareMode ? (COMPARE_LABELS[idx] ?? null) : null;
                  return (
                    <li
                      key={user.userUuid}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm select-none
                        ${isSelected ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}
                    >
                      <button
                        onClick={() => toggleUser(user.userUuid)}
                        className="flex-1 text-left truncate cursor-pointer"
                      >
                        {user.userName}
                      </button>
                      {label && (
                        <span className="text-xs font-bold opacity-70 shrink-0">{label}</span>
                      )}
                      <button
                        onClick={() => handleOpenEditUser(user)}
                        className={userActionBtnCls(isSelected)}
                        title="編集"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.userUuid)}
                        className={userActionBtnCls(isSelected)}
                        title="削除"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {isCompareMode && (
              <p className="mt-2 text-xs text-indigo-400">クリックで状態を一覧表示</p>
            )}
            {selectedUserUuids.length === 1 && (
              <p className="mt-2 text-xs text-slate-500">クリックで状態をサイクル変更</p>
            )}
          </div>

          <div className="flex-1 md:flex-none px-3 py-2 md:px-4 md:pt-4 md:pb-4 overflow-y-auto">
            <SidebarSectionHeader
              label="訪問状態"
              onAdd={handleOpenAddStatus}
              addTitle="訪問状態を追加"
            />
            {statuses.length === 0 ? (
              <p className="text-xs text-slate-500">訪問状態がありません</p>
            ) : (
              <ul className="space-y-1.5">
                {statuses.map((status, index) => (
                  <li
                    key={status.areaStatusUuid}
                    className="flex items-center gap-1 text-xs text-slate-300"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-white/10"
                      style={{ backgroundColor: status.areaStatusColor }}
                    />
                    <span className="flex-1 truncate">{status.areaStatusName}</span>
                    <button
                      onClick={() =>
                        setSaveData((prev) => moveAreaStatusUp(prev, status.areaStatusUuid))
                      }
                      disabled={index === 0}
                      className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="上に移動"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() =>
                        setSaveData((prev) => moveAreaStatusDown(prev, status.areaStatusUuid))
                      }
                      disabled={index === statuses.length - 1}
                      className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="下に移動"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleOpenEditStatus(status)}
                      className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                      title="編集"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteStatus(status.areaStatusUuid)}
                      className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
                      title="削除"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {showNoUserDialog && <NoUserSelectedDialog onClose={() => setShowNoUserDialog(false)} />}

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

      <ModalDialog
        show={importConfirmData !== null}
        title="データを上書きしますか？"
        submitLabel="上書き"
        onClose={() => setImportConfirmData(null)}
        onSubmit={handleConfirmImport}
      >
        <p className="text-sm text-slate-600">
          現在のデータをインポートしたデータで上書きします。この操作は元に戻せません。
        </p>
      </ModalDialog>
    </div>
  );
}

interface SidebarSectionHeaderProps {
  label: string;
  onAdd: () => void;
  addTitle: string;
}

function SidebarSectionHeader({ label, onAdd, addTitle }: SidebarSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <button
        onClick={onAdd}
        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors text-base leading-none"
        title={addTitle}
      >
        +
      </button>
    </div>
  );
}

interface ComparePopupCardProps {
  popup: ComparePopup;
  saveData: SaveDataModel;
  selectedUserUuids: string[];
  onClose: () => void;
}

function NoUserSelectedDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-6 max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-white mb-2">ユーザーが選択されていません</h2>
        <p className="text-xs text-slate-400 mb-4">
          サイドバーの「ユーザー」からユーザーをクリックして選択してから、都道府県をクリックしてください。
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

function ComparePopupCard({ popup, saveData, selectedUserUuids, onClose }: ComparePopupCardProps) {
  return (
    <div
      className="absolute z-10 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-3 min-w-40"
      style={{ left: popup.x + 12, top: popup.y + 12 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-300">都道府県コード: {popup.areaId}</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xs ml-3">
          ✕
        </button>
      </div>
      <ul className="space-y-1.5">
        {selectedUserUuids.map((userUuid) => {
          const user = saveData.userDataModels.find((u) => u.userUuid === userUuid);
          const status = getAreaStatus(saveData, userUuid, popup.areaId);
          return (
            <li key={userUuid} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0 border border-white/10"
                style={{ backgroundColor: status?.areaStatusColor ?? UNVISITED_COLOR }}
              />
              <span className="text-xs text-slate-300 truncate">{user?.userName}</span>
              <span className="text-xs text-slate-500 ml-auto">
                {status?.areaStatusName ?? '未設定'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
