import { useEffect, useRef, useState } from 'react';
import { usePage } from '../../contexts/PageContext';
import { useSaveData } from '../../contexts/SaveDataContext';
import Page from '../../enums/Page';
import { cycleAreaStatus, getAreaStatus } from '../../logic/saveData';
import type { SaveDataModel, UserDataModel } from '../../models';
import mapFullRaw from '../../mapDatas/map-full.svg?raw';
import mapMobileRaw from '../../mapDatas/map-mobile.svg?raw';

const UNVISITED_COLOR = '#f1f5f9';

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

interface ComparePopup {
  x: number;
  y: number;
  areaId: string;
}

export default function VisitedMap() {
  const { saveData, setSaveData } = useSaveData();
  const { setPage } = usePage();
  const mapRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [selectedUserUuids, setSelectedUserUuids] = useState<string[]>([]);
  const [comparePopup, setComparePopup] = useState<ComparePopup | null>(null);

  const isCompareMode = selectedUserUuids.length === 2;
  const mapSvg = isMobile ? mapMobileRaw : mapFullRaw;

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;
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
    defs.querySelectorAll('[id^="vg-"]').forEach((el) => el.remove());

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
    } else if (selectedUserUuids.length === 1) {
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
  }, [saveData, selectedUserUuids, isCompareMode, mapSvg]);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    function handleClick(e: MouseEvent) {
      const target = (e.target as SVGElement).closest<SVGElement>('[data-code]');
      if (!target) {
        setComparePopup(null);
        return;
      }
      const areaId = target.getAttribute('data-code');
      if (!areaId) return;

      if (isCompareMode) {
        const rect = mapRef.current!.getBoundingClientRect();
        setComparePopup({ x: e.clientX - rect.left, y: e.clientY - rect.top, areaId });
        return;
      }

      if (selectedUserUuids.length === 1) {
        setSaveData((prev) => cycleAreaStatus(prev, selectedUserUuids[0], areaId));
      }
    }

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [isCompareMode, selectedUserUuids, setSaveData]);

  function toggleUser(uuid: string) {
    setComparePopup(null);
    setSelectedUserUuids((prev) => {
      if (prev.includes(uuid)) return prev.filter((u) => u !== uuid);
      if (prev.length >= 2) return [prev[1], uuid];
      return [...prev, uuid];
    });
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setPage(Page.UserList)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          ← 戻る
        </button>
        <span className="text-slate-600">|</span>
        <span className="text-sm font-semibold text-white">🗾 訪問マップ</span>
        {isCompareMode && (
          <span className="ml-2 px-2 py-0.5 text-xs font-medium text-indigo-300 bg-indigo-900/50 rounded-full border border-indigo-700">
            比較モード
          </span>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div
          className="flex-1 relative overflow-hidden bg-slate-900"
          onClick={() => setComparePopup(null)}
        >
          <div
            ref={mapRef}
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: mapSvg }}
          />

          {comparePopup && isCompareMode && (
            <ComparePopupCard
              popup={comparePopup}
              saveData={saveData}
              selectedUserUuids={selectedUserUuids}
              onClose={() => setComparePopup(null)}
            />
          )}
        </div>

        <aside className="w-56 shrink-0 bg-slate-800 border-l border-slate-700 flex flex-col overflow-y-auto">
          <div className="px-4 pt-4 pb-3 border-b border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              ユーザー選択
            </p>
            {saveData.userDataModels.length === 0 ? (
              <p className="text-xs text-slate-500">ユーザーがいません</p>
            ) : (
              <ul className="space-y-1">
                {saveData.userDataModels.map((user) => (
                  <UserSelectItem
                    key={user.userUuid}
                    user={user}
                    index={selectedUserUuids.indexOf(user.userUuid)}
                    onToggle={() => toggleUser(user.userUuid)}
                  />
                ))}
              </ul>
            )}
            {isCompareMode && (
              <p className="mt-2 text-xs text-indigo-400">クリックで状態を一覧表示</p>
            )}
            {selectedUserUuids.length === 1 && (
              <p className="mt-2 text-xs text-slate-500">クリックで状態をサイクル変更</p>
            )}
          </div>

          <div className="px-4 pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              凡例
            </p>
            {saveData.areaStatusModels.length === 0 ? (
              <p className="text-xs text-slate-500">訪問状態がありません</p>
            ) : (
              <ul className="space-y-2">
                {saveData.areaStatusModels.map((status) => (
                  <li key={status.areaStatusUuid} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-white/10"
                      style={{ backgroundColor: status.areaStatusColor }}
                    />
                    <span className="text-xs text-slate-300">{status.areaStatusName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

interface UserSelectItemProps {
  user: UserDataModel;
  index: number;
  onToggle: () => void;
}

function UserSelectItem({ user, index, onToggle }: UserSelectItemProps) {
  const isSelected = index !== -1;
  const label = index === 0 ? '左' : index === 1 ? '右' : null;
  return (
    <li
      onClick={onToggle}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors select-none
        ${isSelected ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
    >
      <span className="flex-1 truncate">{user.userName}</span>
      {label && <span className="text-xs font-bold opacity-70">{label}</span>}
    </li>
  );
}

interface ComparePopupCardProps {
  popup: ComparePopup;
  saveData: SaveDataModel;
  selectedUserUuids: string[];
  onClose: () => void;
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
