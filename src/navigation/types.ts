export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  ThoughtSelectTab: undefined;
  SettingTab: undefined;
};

export type HomeStackParamList = {
  Chat: {
    thoughtId?: number;
    parentNodeId?: number;
    createNewBranch?: boolean;
    threadRootId?: number;
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
