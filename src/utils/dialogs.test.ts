import { runWebDialog, type BrowserDialogApi } from './dialogs';

describe('runWebDialog', () => {
  const makeBrowser = (accepted: boolean): BrowserDialogApi => ({
    alert: jest.fn(),
    confirm: jest.fn(() => accepted),
  });

  it('runs the affirmative callback after browser confirmation', () => {
    const browser = makeBrowser(true);
    const cancel = jest.fn();
    const accept = jest.fn();

    runWebDialog(
      'Delete record',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: cancel },
        { text: 'Delete', style: 'destructive', onPress: accept },
      ],
      browser,
    );

    expect(browser.confirm).toHaveBeenCalledWith(
      'Delete record\n\nThis cannot be undone.',
    );
    expect(accept).toHaveBeenCalledTimes(1);
    expect(cancel).not.toHaveBeenCalled();
  });

  it('does not run either callback when the user cancels', () => {
    const browser = makeBrowser(false);
    const cancel = jest.fn();
    const accept = jest.fn();

    runWebDialog(
      'Delete record',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: cancel },
        { text: 'Delete', style: 'destructive', onPress: accept },
      ],
      browser,
    );

    expect(accept).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it('shows informational and error messages and invokes a sole acknowledgement', () => {
    const browser = makeBrowser(true);
    const acknowledge = jest.fn();

    runWebDialog('Request failed', 'Try again.', undefined, browser);
    runWebDialog(
      'Saved',
      'Your changes are ready.',
      [{ text: 'OK', onPress: acknowledge }],
      browser,
    );

    expect(browser.alert).toHaveBeenNthCalledWith(
      1,
      'Request failed\n\nTry again.',
    );
    expect(browser.alert).toHaveBeenNthCalledWith(
      2,
      'Saved\n\nYour changes are ready.',
    );
    expect(acknowledge).toHaveBeenCalledTimes(1);
  });
});
