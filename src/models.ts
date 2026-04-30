export const SAVE_DATA_VERSION = 1;

export interface SaveDataModel {
  version: number;
  areaStatusModels: AreaStatusModel[];
  userDataModels: UserDataModel[];
}

export interface AreaStatusModel {
  areaStatusUuid: string;
  areaStatusName: string;
  areaStatusColor: string;
}

export interface UserDataModel {
  userUuid: string;
  userName: string;
  mapDataModels: MapDataModel[];
}

export interface MapDataModel {
  areaId: string;
  areaStatusUuid: string;
}
