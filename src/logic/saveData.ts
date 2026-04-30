import type { AreaStatusModel, SaveDataModel } from '../models';
import { SAVE_DATA_VERSION } from '../models';

export function createDefaultSaveData(): SaveDataModel {
  return {
    version: SAVE_DATA_VERSION,
    areaStatusModels: [
      { areaStatusUuid: crypto.randomUUID(), areaStatusName: '通過', areaStatusColor: '#FFD54F' },
      { areaStatusUuid: crypto.randomUUID(), areaStatusName: '観光', areaStatusColor: '#81C784' },
      { areaStatusUuid: crypto.randomUUID(), areaStatusName: '居住', areaStatusColor: '#64B5F6' },
    ],
    userDataModels: [],
  };
}

export function addUser(data: SaveDataModel): SaveDataModel {
  const newUser = {
    userUuid: crypto.randomUUID(),
    userName: `ユーザー${data.userDataModels.length + 1}`,
    mapDataModels: [],
  };
  return { ...data, userDataModels: [...data.userDataModels, newUser] };
}

export function updateUser(data: SaveDataModel, userUuid: string, userName: string): SaveDataModel {
  return {
    ...data,
    userDataModels: data.userDataModels.map((u) =>
      u.userUuid === userUuid ? { ...u, userName } : u,
    ),
  };
}

export function deleteUsers(data: SaveDataModel, userUuids: Set<string>): SaveDataModel {
  return {
    ...data,
    userDataModels: data.userDataModels.filter((u) => !userUuids.has(u.userUuid)),
  };
}

export function addAreaStatus(
  data: SaveDataModel,
  status: { name: string; color: string },
): SaveDataModel {
  const newStatus: AreaStatusModel = {
    areaStatusUuid: crypto.randomUUID(),
    areaStatusName: status.name,
    areaStatusColor: status.color,
  };
  return { ...data, areaStatusModels: [...data.areaStatusModels, newStatus] };
}

export function updateAreaStatus(
  data: SaveDataModel,
  uuid: string,
  status: { name: string; color: string },
): SaveDataModel {
  return {
    ...data,
    areaStatusModels: data.areaStatusModels.map((s) =>
      s.areaStatusUuid === uuid
        ? { ...s, areaStatusName: status.name, areaStatusColor: status.color }
        : s,
    ),
  };
}

export function deleteAreaStatuses(data: SaveDataModel, uuids: Set<string>): SaveDataModel {
  return {
    ...data,
    areaStatusModels: data.areaStatusModels.filter((s) => !uuids.has(s.areaStatusUuid)),
    userDataModels: data.userDataModels.map((u) => ({
      ...u,
      mapDataModels: u.mapDataModels.filter((m) => !uuids.has(m.areaStatusUuid)),
    })),
  };
}

export function moveAreaStatusUp(data: SaveDataModel, uuid: string): SaveDataModel {
  const index = data.areaStatusModels.findIndex((s) => s.areaStatusUuid === uuid);
  if (index <= 0) return data;
  const newStatuses = [...data.areaStatusModels];
  [newStatuses[index - 1], newStatuses[index]] = [newStatuses[index], newStatuses[index - 1]];
  return { ...data, areaStatusModels: newStatuses };
}

export function moveAreaStatusDown(data: SaveDataModel, uuid: string): SaveDataModel {
  const index = data.areaStatusModels.findIndex((s) => s.areaStatusUuid === uuid);
  if (index < 0 || index >= data.areaStatusModels.length - 1) return data;
  const newStatuses = [...data.areaStatusModels];
  [newStatuses[index], newStatuses[index + 1]] = [newStatuses[index + 1], newStatuses[index]];
  return { ...data, areaStatusModels: newStatuses };
}

export function getAreaStatusUuid(
  data: SaveDataModel,
  userUuid: string,
  areaId: string,
): string | undefined {
  const user = data.userDataModels.find((u) => u.userUuid === userUuid);
  return user?.mapDataModels.find((m) => m.areaId === areaId)?.areaStatusUuid;
}

export function getAreaStatus(
  data: SaveDataModel,
  userUuid: string,
  areaId: string,
): AreaStatusModel | undefined {
  const uuid = getAreaStatusUuid(data, userUuid, areaId);
  return data.areaStatusModels.find((s) => s.areaStatusUuid === uuid);
}

export function cycleAreaStatus(
  data: SaveDataModel,
  userUuid: string,
  areaId: string,
): SaveDataModel {
  if (data.areaStatusModels.length === 0) return data;

  const currentUuid = getAreaStatusUuid(data, userUuid, areaId);
  const currentIndex = currentUuid
    ? data.areaStatusModels.findIndex((s) => s.areaStatusUuid === currentUuid)
    : -1;

  return {
    ...data,
    userDataModels: data.userDataModels.map((u) => {
      if (u.userUuid !== userUuid) return u;

      if (currentIndex === data.areaStatusModels.length - 1) {
        return { ...u, mapDataModels: u.mapDataModels.filter((m) => m.areaId !== areaId) };
      }

      const nextUuid = data.areaStatusModels[currentIndex + 1].areaStatusUuid;
      const exists = u.mapDataModels.some((m) => m.areaId === areaId);
      if (exists) {
        return {
          ...u,
          mapDataModels: u.mapDataModels.map((m) =>
            m.areaId === areaId ? { ...m, areaStatusUuid: nextUuid } : m,
          ),
        };
      }
      return {
        ...u,
        mapDataModels: [...u.mapDataModels, { areaId, areaStatusUuid: nextUuid }],
      };
    }),
  };
}
