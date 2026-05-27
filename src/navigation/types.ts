export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type TabParamList = {
  Home: undefined;
  ThoughtSelect: undefined;
  Setting: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Detail: {
    thoughtId: number;
    parentNodeId: number;
  };
};

export type ThoughtSelectStackParamList = {
  ThoughtSelect: undefined;
  ThoughtView: {
    thoughtId: number;
  };
};

export type SettingStackParamList = {
  Setting: undefined;
};
