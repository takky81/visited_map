import { useContext, useState } from 'react';

import { SaveDataContext } from '../../contexts/SaveDataContext';
import { save } from '../../utils';
import { PageContext } from '../../contexts/PageContext';
import type { UserDataModel } from '../../models';
import Page from '../../enums/Page';

export default function UserList() {
  const { setPage } = useContext(PageContext);
  const { saveData, setSaveData } = useContext(SaveDataContext);
  const [selectedUserUuids, setSelectedUserUuids] = useState<Set<string>>(new Set());
  const [editedUserData, setEditedUserData] = useState<UserDataModel | undefined>(undefined);
  const [editedUserName, setEditedUserName] = useState<string>('');

  const userDatas = saveData.userDataModels;

  function handleAddUser() {
    const newUser = {
      userUuid: crypto.randomUUID(),
      userName: `ユーザー${userDatas.length + 1}`,
      mapDataModels: [],
    };

    const newSaveData = {
      ...saveData,
      userDataModels: [...saveData.userDataModels, newUser],
    };

    setSaveData(newSaveData);
    save(newSaveData);
  }

  function handleEditUser() {
    if (selectedUserUuids.size === 0) {
      return;
    } else if (1 < selectedUserUuids.size) {
      return;
    }
    const editedUserData = userDatas.find((userData) => selectedUserUuids.has(userData.userUuid));
    if (!editedUserData) {
      throw new Error('選択されているユーザーが存在しません。');
    }
    setEditedUserData(editedUserData);
    setEditedUserName(editedUserData.userName);
  }

  function handleDeleteUser() {
    const newSaveData = {
      ...saveData,
      userDataModels: userDatas.filter((userData) => !selectedUserUuids.has(userData.userUuid)),
    };

    setSaveData(newSaveData);
    save(newSaveData);
  }

  function handleClickRow(userUuid: string) {
    setSelectedUserUuids((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userUuid)) {
        newSet.delete(userUuid);
      } else {
        newSet.add(userUuid);
      }
      return newSet;
    });
  }

  function handleEditingDialogClose() {
    setEditedUserData(undefined);
  }

  function handleSaveEditedUser() {
    if (!editedUserData) {
      return;
    }
    const newSaveData = {
      ...saveData,
      userDataModels: userDatas.map((userData) =>
        userData.userUuid === editedUserData.userUuid
          ? { ...editedUserData, userName: editedUserName }
          : userData,
      ),
    };
    setSaveData(newSaveData);
    save(newSaveData);
    handleEditingDialogClose();
  }

  return (
    <div className="p-4">
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3">名前</th>
          </tr>
        </thead>
        <tbody>
          {userDatas.map((userData) => (
            <tr
              key={userData.userUuid}
              className={`cursor-pointer border-b hover:bg-blue-50 ${
                selectedUserUuids.has(userData.userUuid) ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleClickRow(userData.userUuid)}
            >
              <td className="py-2 px-3">{userData.userName}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2 mb-4">
        <button
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          onClick={handleAddUser}
        >
          追加
        </button>
        <button
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          onClick={handleEditUser}
        >
          編集
        </button>
        <button
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          onClick={handleDeleteUser}
        >
          削除
        </button>
      </div>

      <div className="flex justify-end">
        <button
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
          onClick={() => setPage(Page.VisitedMap)}
        >
          マップを開く
        </button>
      </div>

      {editedUserData !== undefined && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h5 className="text-lg font-semibold">ユーザー編集</h5>
              <button
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                onClick={handleEditingDialogClose}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                名前
              </label>
              <input
                type="text"
                id="name"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editedUserName}
                onChange={(e) => setEditedUserName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                onClick={handleEditingDialogClose}
              >
                閉じる
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
                onClick={handleSaveEditedUser}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
