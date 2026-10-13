export type DialogButton = {
  text: string;
  style?: 'cancel' | 'default' | 'destructive';
  onPress?: () => void | Promise<void>;
};

export type BrowserDialogApi = {
  alert: (message?: string) => void;
  confirm: (message?: string) => boolean;
};

/** Routes an alert/confirmation through native Alert or the browser dialogs. */
export const showDialog = (
  title: string,
  message?: string,
  buttons?: DialogButton[],
) => {
  // Load React Native only when the UI-facing entry point runs. This keeps
  // the browser dialog behavior independently testable in Jest's Node runtime.
  const { Alert, Platform } =
    require('react-native') as typeof import('react-native');

  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  runWebDialog(title, message, buttons, {
    alert: (text) => window.alert(text),
    confirm: (text) => window.confirm(text),
  });
};

/** Kept separate so accept/cancel behavior can be tested without browser UI. */
export const runWebDialog = (
  title: string,
  message: string | undefined,
  buttons: DialogButton[] | undefined,
  browser: BrowserDialogApi,
) => {
  const text = [title, message].filter(Boolean).join('\n\n');

  if (!buttons?.length) {
    browser.alert(text);
    return;
  }

  if (buttons.length === 1) {
    browser.alert(text);
    buttons[0].onPress?.();
    return;
  }

  if (!browser.confirm(text)) return;

  const affirmativeButton = buttons.find((button) => button.style !== 'cancel');
  affirmativeButton?.onPress?.();
};
