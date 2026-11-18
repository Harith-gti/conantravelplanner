/* config.js: optional settings.
   unsplashKey : to show licensed, high-quality destination photos with the photographer's credit, create a free
                 Unsplash developer account (https://unsplash.com/developers), create an app and paste its Access Key
                 between the quotes. The key is visible in the page source, so use only a free demo key.
   databaseUrl : to keep each account's data online (so it is still there on another device), create a free Firebase
                 Realtime Database and paste its address between the quotes, e.g.
                 'https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app'. See README.md for the steps.
                 Leave it empty to save in this browser only.
   syncDemo    : true = the shared demo account is also saved online (same data on every device). */
window.CX_CONFIG = {unsplashKey: '', databaseUrl: 'https://conantravelplanner-default-rtdb.asia-southeast1.firebasedatabase.app', syncDemo: true};
