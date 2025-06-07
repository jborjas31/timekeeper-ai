XHRGET
https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?gsessionid=GzzuVmbIWQxNTPTv8zStL9BfONjfdcXrTJQmowVWiN0&VER=8&database=projects/timekeeper-ai/databases/(default)&RID=rpc&SID=oRLUZPVC8J3expgqe8WUhQ&AID=22&CI=0&TYPE=xmlhttp&zx=v1hofnejov6i&t=1
NS_BINDING_ABORTED

GET
https://jborjas31.github.io/timekeeper-ai/
[HTTP/2 200  648ms]

XHRGET
https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?gsessionid=GzzuVmbIWQxNTPTv8zStL9BfONjfdcXrTJQmowVWiN0&VER=8&database=projects/timekeeper-ai/databases/(default)&RID=rpc&SID=oRLUZPVC8J3expgqe8WUhQ&AID=24&CI=0&TYPE=xmlhttp&zx=76grk9fkr9pi&t=1

GET
https://jborjas31.github.io/timekeeper-ai/styles.css
[HTTP/2 200 OK 0ms]

GET
https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js

GET
https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js

GET
https://jborjas31.github.io/timekeeper-ai/js/utils/time-utils.js

GET
https://jborjas31.github.io/timekeeper-ai/js/utils/validation-utils.js

GET
https://jborjas31.github.io/timekeeper-ai/js/utils/debug-utils.js

GET
https://jborjas31.github.io/timekeeper-ai/js/config/app-config.js

GET
https://jborjas31.github.io/timekeeper-ai/js/config/firebase-config.js
[HTTP/2 200  0ms]

GET
https://jborjas31.github.io/timekeeper-ai/js/engine/schedule-calculator.js
[HTTP/2 200  0ms]

GET
https://jborjas31.github.io/timekeeper-ai/js/renderer/time-grid-renderer.js
[HTTP/2 200  0ms]

GET
https://jborjas31.github.io/timekeeper-ai/js/controllers/task-controller.js
[HTTP/2 200  0ms]

GET
https://jborjas31.github.io/timekeeper-ai/js/controllers/storage-controller.js
[HTTP/2 200  0ms]

GET
https://jborjas31.github.io/timekeeper-ai/js/controllers/ui-controller.js
[HTTP/2 200  0ms]

GET
https://jborjas31.github.io/timekeeper-ai/js/main.js
[HTTP/2 200  0ms]

GET
https://jborjas31.github.io/favicon.ico
[HTTP/2 404  0ms]

✅ Firebase initialized successfully (single-user mode) firebase-config.js:34:25
[2025-06-07T18:27:22.546Z]  @firebase/firestore: Firestore (10.7.1): enableMultiTabIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. firebase-firestore-compat.js:1:5983
✅ Single-user Firestore ready 2 storage-controller.js:35:21
✅ Firestore offline persistence enabled firebase-config.js:43:29
XHRPOST
https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?VER=8&database=projects/timekeeper-ai/databases/(default)&RID=63630&CVER=22&X-HTTP-Session-Id=gsessionid&zx=yigvxo7krepe&t=1
[HTTP/3 200  136ms]

XHRGET
https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?gsessionid=vwv7aonR6ElKDiPwv16samAxzhAdHtsmnRpcg6JOMPU&VER=8&database=projects/timekeeper-ai/databases/(default)&RID=rpc&SID=kQzOT4KIvnHPelByMEsQNw&AID=0&CI=0&TYPE=xmlhttp&zx=qdb350shw1cr&t=1

🔄 Tasks synced from Firestore (1 tasks) storage-controller.js:174:33
XHRPOST
https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?VER=8&database=projects/timekeeper-ai/databases/(default)&gsessionid=vwv7aonR6ElKDiPwv16samAxzhAdHtsmnRpcg6JOMPU&SID=kQzOT4KIvnHPelByMEsQNw&RID=63631&AID=8&zx=sic1yx1ud1ai&t=1
[HTTP/3 200  148ms]

XHRPOST
https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?VER=8&database=projects/timekeeper-ai/databases/(default)&gsessionid=vwv7aonR6ElKDiPwv16samAxzhAdHtsmnRpcg6JOMPU&SID=kQzOT4KIvnHPelByMEsQNw&RID=63632&AID=8&zx=hw5n206u4xvy&t=1
[HTTP/3 200  241ms]

XHRPOST
https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?VER=8&database=projects/timekeeper-ai/databases/(default)&gsessionid=vwv7aonR6ElKDiPwv16samAxzhAdHtsmnRpcg6JOMPU&SID=kQzOT4KIvnHPelByMEsQNw&RID=63633&AID=8&zx=5msu18i7kaxw&t=1
[HTTP/3 200  257ms]

XHRPOST
https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?VER=8&database=projects/timekeeper-ai/databases/(default)&gsessionid=vwv7aonR6ElKDiPwv16samAxzhAdHtsmnRpcg6JOMPU&SID=kQzOT4KIvnHPelByMEsQNw&RID=63634&AID=8&zx=x39xq6f0lst9&t=1
[HTTP/3 200  257ms]

✅ Single-user Firestore ready storage-controller.js:35:21
Background sync failed: Function DocumentReference.set() called with invalid data. Unsupported field value: undefined (found in document tasks/userTasks) storage-controller.js:117:21
📝 tasks queued for retry (attempt 1) storage-controller.js:424:21
Uncaught (in promise) Error: Firestore timeout
    timeoutPromise https://jborjas31.github.io/timekeeper-ai/js/controllers/storage-controller.js:97
    setTimeout handler*backgroundSyncTasks/timeoutPromise< https://jborjas31.github.io/timekeeper-ai/js/controllers/storage-controller.js:97
    backgroundSyncTasks https://jborjas31.github.io/timekeeper-ai/js/controllers/storage-controller.js:96
    saveTasks https://jborjas31.github.io/timekeeper-ai/js/controllers/storage-controller.js:71
    saveAndRefresh https://jborjas31.github.io/timekeeper-ai/js/main.js:113
    onsubmit https://jborjas31.github.io/timekeeper-ai/js/controllers/ui-controller.js:32
    bindEvents https://jborjas31.github.io/timekeeper-ai/js/controllers/ui-controller.js:29
    init https://jborjas31.github.io/timekeeper-ai/js/main.js:21
    TimeKeeper https://jborjas31.github.io/timekeeper-ai/js/main.js:13
    initializeApp https://jborjas31.github.io/timekeeper-ai/js/main.js:349
    <anonymous> https://jborjas31.github.io/timekeeper-ai/js/main.js:378
    <anonymous> https://jborjas31.github.io/timekeeper-ai/js/main.js:385
    EventListener.handleEvent* https://jborjas31.github.io/timekeeper-ai/js/main.js:347
storage-controller.js:97:41
