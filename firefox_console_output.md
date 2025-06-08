GET
http://127.0.0.1:8082/
[HTTP/1 304 Not Modified 41ms]

GET
http://127.0.0.1:8082/styles.css
[HTTP/1 304 Not Modified 36ms]

GET
http://127.0.0.1:8082/js/utils/time-utils.js
[HTTP/1 200 OK 0ms]

GET
http://127.0.0.1:8082/js/utils/validation-utils.js
[HTTP/1 200 OK 0ms]

GET
http://127.0.0.1:8082/js/utils/debug-utils.js
[HTTP/1 200 OK 0ms]

GET
http://127.0.0.1:8082/js/config/app-config.js
[HTTP/1 304 Not Modified 12ms]

GET
http://127.0.0.1:8082/js/config/firebase-config.js
[HTTP/1 200 OK 0ms]

GET
http://127.0.0.1:8082/js/engine/schedule-calculator.js
[HTTP/1 304 Not Modified 8ms]

GET
http://127.0.0.1:8082/js/renderer/simple-time-grid-renderer.js
[HTTP/1 200 OK 12ms]

GET
http://127.0.0.1:8082/js/controllers/task-controller.js
[HTTP/1 200 OK 0ms]

GET
http://127.0.0.1:8082/js/controllers/storage-controller.js
[HTTP/1 304 Not Modified 28ms]

GET
http://127.0.0.1:8082/js/controllers/ui-controller.js
[HTTP/1 200 OK 19ms]

GET
http://127.0.0.1:8082/js/main.js
[HTTP/1 200 OK 0ms]

GET
https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js
[HTTP/2 200  0ms]

GET
https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js
[HTTP/2 200  0ms]

Error in parsing value for ‘-webkit-text-size-adjust’.  Declaration dropped. styles.css:15:31
Unknown property ‘-moz-osx-font-smoothing’.  Declaration dropped. styles.css:17:29
GET
http://127.0.0.1:8082/favicon.ico
[HTTP/1 404 File not found 0ms]

✅ Firebase initialized successfully (single-user mode) firebase-config.js:34:25
[2025-06-08T10:37:23.105Z]  @firebase/firestore: Firestore (10.7.1): enableMultiTabIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. firebase-firestore-compat.js:1:5983
💾 Tasks loaded from localStorage (offline mode) storage-controller.js:161:21
📥 STORAGE: Loading completions from localStorage - Raw data: null storage-controller.js:606:21
📥 STORAGE: No saved completions found, using empty object storage-controller.js:614:25
💾 Completions loaded from localStorage (offline mode) storage-controller.js:268:21
🎯 UI: Setting up taskCompletion event listener ui-controller.js:75:17
🎯 UI: Event listener attached. Total listeners on document: getEventListeners not available ui-controller.js:80:17
🔄 UI: generateTimeGrid() called - Stack trace: init@http://127.0.0.1:8082/js/main.js:23:27
async*TimeKeeper@http://127.0.0.1:8082/js/main.js:13:14
initializeApp@http://127.0.0.1:8082/js/main.js:304:15 ui-controller.js:221:17
🔄 UI: About to calculate schedule - Current completions: {} ui-controller.js:232:21
🔍 SCHEDULE: Checking completion - Key: task_mbnir2bl_mvyww-2025-06-08, Task: Test, Completed: false schedule-calculator.js:395:17
🔍 SCHEDULE: All completions: {} schedule-calculator.js:396:17
🔍 SCHEDULE: Checking completion - Key: task_mbnir2bl_mvyww-2025-06-08, Task: Test, Completed: false schedule-calculator.js:395:17
🔍 SCHEDULE: All completions: {} schedule-calculator.js:396:17
🔄 UI: Schedule calculated - Task count: 2 ui-controller.js:234:21
🔄 UI: Grid rendered successfully ui-controller.js:239:21
✅ Firestore offline persistence enabled firebase-config.js:43:29
🎯 UI: Testing event listener with dummy event ui-controller.js:84:21
🌍 WINDOW: Global taskCompletion listener caught event: 
Object { taskId: "test", date: Date Sun Jun 08 2025 12:37:24 GMT+0200 (Central European Summer Time), completed: true }
ui-controller.js:94:21
🎯 UI: Test event dispatched: true ui-controller.js:89:21
🐛 QUICK TEST: App loaded, checking if debugging works 127.0.0.1:8082:129:25
🐛 QUICK TEST: Window.app exists: true 127.0.0.1:8082:130:25
🐛 QUICK TEST: Current completions: {} 127.0.0.1:8082:132:29
✅ Task completion change: Test -> completed simple-time-grid-renderer.js:143:21
🚀 RENDERER: Dispatching taskCompletion event: 
Object { taskId: "task_mbnir2bl_mvyww", date: Date Sun Jun 08 2025 12:37:23 GMT+0200 (Central European Summer Time), completed: true, timestamp: 1749379048990 }
simple-time-grid-renderer.js:163:21
🚀 RENDERER: window.app exists: true simple-time-grid-renderer.js:166:21
🚀 RENDERER: window.app.uiController exists: true simple-time-grid-renderer.js:167:21
🚀 RENDERER: uiController.boundHandlers: 
Object {  }
simple-time-grid-renderer.js:168:21
🌍 WINDOW: Global taskCompletion listener caught event: 
Object { taskId: "task_mbnir2bl_mvyww", date: Date Sun Jun 08 2025 12:37:23 GMT+0200 (Central European Summer Time), completed: true, timestamp: 1749379048990 }
ui-controller.js:94:21
🚀 RENDERER: Event dispatched successfully: true simple-time-grid-renderer.js:176:21
🚀 RENDERER: Calling handleTaskCompletion directly as backup simple-time-grid-renderer.js:180:25
🎯 UI: handleTaskCompletion() called with: 
Object { taskId: "task_mbnir2bl_mvyww", date: Date Sun Jun 08 2025 12:37:23 GMT+0200 (Central European Summer Time), completed: true, timestamp: 1749379048990 }
ui-controller.js:99:17
🎯 UI: Parsed event - taskId: task_mbnir2bl_mvyww, completed: true ui-controller.js:103:21
🎯 UI: Found task: 
Object { id: "task_mbnir2bl_mvyww", name: "Test", time: "12:30 PM", duration: 30, frequency: "once", required: true, dependsOn: null, bufferTime: 5, createdDate: "2025-06-08T10:27:13.665Z" }
ui-controller.js:106:21
🎯 UI: Set lastUserInteractionTime to: 1749379049009 ui-controller.js:121:21
🎯 UI: Using completion key: task_mbnir2bl_mvyww-2025-06-08 ui-controller.js:126:21
🎯 UI: Marking task as completed ui-controller.js:129:25
🟢 STORAGE: Marking task complete - Key: task_mbnir2bl_mvyww-2025-06-08, Task: Test storage-controller.js:525:17
🟢 STORAGE: Completions BEFORE: {"task_mbnir2bl_mvyww-2025-06-08":true} storage-controller.js:526:17
🟢 STORAGE: Completions AFTER: {"task_mbnir2bl_mvyww-2025-06-08":true} storage-controller.js:531:17
🟢 STORAGE: Saved to localStorage: {"task_mbnir2bl_mvyww-2025-06-08":true} storage-controller.js:538:17
🎯 UI: Completions after update: {"task_mbnir2bl_mvyww-2025-06-08":true} ui-controller.js:142:21
🔄 UI: generateTimeGrid() called - Stack trace: handleTaskCompletion@http://127.0.0.1:8082/js/controllers/ui-controller.js:145:18
createSimpleTaskElement/<@http://127.0.0.1:8082/js/renderer/simple-time-grid-renderer.js:181:41
EventListener.handleEvent*createSimpleTaskElement@http://127.0.0.1:8082/js/renderer/simple-time-grid-renderer.js:139:18 ui-controller.js:221:17
🔄 UI: About to calculate schedule - Current completions: {"task_mbnir2bl_mvyww-2025-06-08":true} ui-controller.js:232:21
🔍 SCHEDULE: Checking completion - Key: task_mbnir2bl_mvyww-2025-06-08, Task: Test, Completed: true schedule-calculator.js:395:17
🔍 SCHEDULE: All completions: {"task_mbnir2bl_mvyww-2025-06-08":true} schedule-calculator.js:396:17
🔍 SCHEDULE: Checking completion - Key: task_mbnir2bl_mvyww-2025-06-08, Task: Test, Completed: true schedule-calculator.js:395:17
🔍 SCHEDULE: All completions: {"task_mbnir2bl_mvyww-2025-06-08":true} schedule-calculator.js:396:17
🔄 UI: Schedule calculated - Task count: 1 ui-controller.js:234:21
🔄 UI: Grid rendered successfully ui-controller.js:239:21
🔄 UI: generateTimeGrid() called - Stack trace: scheduleUpdates/<@http://127.0.0.1:8082/js/controllers/ui-controller.js:255:22
setInterval handler*scheduleUpdates@http://127.0.0.1:8082/js/controllers/ui-controller.js:251:29
init@http://127.0.0.1:8082/js/main.js:24:27 ui-controller.js:221:17
🔄 UI: About to calculate schedule - Current completions: {"task_mbnir2bl_mvyww-2025-06-08":true} ui-controller.js:232:21
🔍 SCHEDULE: Checking completion - Key: task_mbnir2bl_mvyww-2025-06-08, Task: Test, Completed: true schedule-calculator.js:395:17
🔍 SCHEDULE: All completions: {"task_mbnir2bl_mvyww-2025-06-08":true} schedule-calculator.js:396:17
🔍 SCHEDULE: Checking completion - Key: task_mbnir2bl_mvyww-2025-06-08, Task: Test, Completed: true schedule-calculator.js:395:17
🔍 SCHEDULE: All completions: {"task_mbnir2bl_mvyww-2025-06-08":true} schedule-calculator.js:396:17
🔄 UI: Schedule calculated - Task count: 1 ui-controller.js:234:21
🔄 UI: Grid rendered successfully ui-controller.js:239:21
🔄 UI: generateTimeGrid() called - Stack trace: scheduleUpdates/<@http://127.0.0.1:8082/js/controllers/ui-controller.js:255:22
setInterval handler*scheduleUpdates@http://127.0.0.1:8082/js/controllers/ui-controller.js:251:29
init@http://127.0.0.1:8082/js/main.js:24:27 ui-controller.js:221:17
🔄 UI: About to calculate schedule - Current completions: {"task_mbnir2bl_mvyww-2025-06-08":true} ui-controller.js:232:21
🔍 SCHEDULE: Checking completion - Key: task_mbnir2bl_mvyww-2025-06-08, Task: Test, Completed: true schedule-calculator.js:395:17
🔍 SCHEDULE: All completions: {"task_mbnir2bl_mvyww-2025-06-08":true} schedule-calculator.js:396:17
🔍 SCHEDULE: Checking completion - Key: task_mbnir2bl_mvyww-2025-06-08, Task: Test, Completed: true schedule-calculator.js:395:17
🔍 SCHEDULE: All completions: {"task_mbnir2bl_mvyww-2025-06-08":true} schedule-calculator.js:396:17
🔄 UI: Schedule calculated - Task count: 1 ui-controller.js:234:21
🔄 UI: Grid rendered successfully ui-controller.js:239:21
🔄 UI: generateTimeGrid() called - Stack trace: scheduleUpdates/<@http://127.0.0.1:8082/js/controllers/ui-controller.js:255:22
setInterval handler*scheduleUpdates@http://127.0.0.1:8082/js/controllers/ui-controller.js:251:29
init@http://127.0.0.1:8082/js/main.js:24:27 ui-controller.js:221:17
🔄 UI: About to calculate schedule - Current completions: {"task_mbnir2bl_mvyww-2025-06-08":true} ui-controller.js:232:21
🔍 SCHEDULE: Checking completion - Key: task_mbnir2bl_mvyww-2025-06-08, Task: Test, Completed: true schedule-calculator.js:395:17
🔍 SCHEDULE: All completions: {"task_mbnir2bl_mvyww-2025-06-08":true} schedule-calculator.js:396:17
🔍 SCHEDULE: Checking completion - Key: task_mbnir2bl_mvyww-2025-06-08, Task: Test, Completed: true schedule-calculator.js:395:17
🔍 SCHEDULE: All completions: {"task_mbnir2bl_mvyww-2025-06-08":true} schedule-calculator.js:396:17
🔄 UI: Schedule calculated - Task count: 1 ui-controller.js:234:21
🔄 UI: Grid rendered successfully ui-controller.js:239:21
