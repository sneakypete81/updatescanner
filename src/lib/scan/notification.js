import {showAllChanges} from 'main/main_url';

const NOTIFICATION_ID = 'updatescanner';

/**
 * Show an OS notification that webpage updates have been detected.
 *
 * @param {integer} updateCount - Number of updates.
 */
export function showNotification(updateCount) {
  let message;
  if (updateCount == 0) {
    message = 'No updates were detected.';
  } else if (updateCount == 1) {
    message = 'A webpage has been updated.';
  } else {
    message = `${updateCount} webpages have been updated.`;
  }

  let clickMessage;
  if (updateCount == 0) {
    clickMessage = '';
  } else {
    clickMessage = 'Click this panel to view the changes.';
  }

  browser.notifications.create(NOTIFICATION_ID, {
    type: 'basic',
    title: 'Update Scanner',
    iconUrl: 'images/updatescanner_48.png',
    message: '\n' + message + '\n' + clickMessage,
  });

  if (!browser.notifications.onClicked.hasListener(handleNotificationClick)) {
    browser.notifications.onClicked.addListener(handleNotificationClick);
  }
}


/**
 * Called when a notification is clicked.
 *
 * @param {string} id - ID of the notification.
 */
function handleNotificationClick(id) {
  if (id == NOTIFICATION_ID) {
    showAllChanges();
  }
}
