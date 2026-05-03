export type TabParamList = {
  Home: undefined;
  Setting: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Detail: {
    thoughtId: number;
    parentNodeId: number; // このノードへの返信スレッドを表示する
  };
};

export type SettingStackParamList = {
  Setting: undefined;
};
