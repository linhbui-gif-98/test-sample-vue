<script setup lang="ts">
import { ref, onMounted  } from 'vue';
import axios from 'axios';

const clientId = 'v9678cdu0s1f86e';
// State variables
const accessToken = ref('sl.B9uDbuo025CVEbOYZXR7Qx1AIXi7j33Vtq3SdZw54AWlypzNXQK3NcYGIJ51SneixJB5f52PjM0__175pd8qjLFAplkpu-DCfadUgwF6FRaqIJIR6aUhBmOXarRJ7cB1AcP-gvLDwZLfp0AwFqhd');
const isDragging = ref(false);

// Reference for file input
const fileInput = ref<HTMLInputElement | null>(null);
const files = ref<File[]>([]);
const sessionCursors = ref<string[]>([]);
const workers = ref(10);
const tasksCompleted = ref(0);
const totalTasks = ref(0);
const allowSize = ref(4 * 1024 * 1024);
const loading = ref(false)
// Methods
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelection = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    files.value = Array.from(input.files);
  }
};

const handleDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files) {
    files.value = Array.from(event.dataTransfer.files);
  }
};

const removeFile = (index: number) => {
  files.value.splice(index, 1);
};
// Step 1: Start concurrent batch sessions
const startConcurrentBatch = async () => {
  if (files.value.length === 0) {
    alert('Please select files to upload.');
    return;
  }

  try {
    loading.value = true
    // Start the batch session, specifying the number of sessions equal to the number of files
    const response = await axios.post(
        'https://api.dropboxapi.com/2/files/upload_session/start_batch',
        {
          session_type: 'concurrent',
          num_sessions: files.value.length // Number of sessions to match the number of files
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json'
          }
        }
    );

    // Store session cursors for each file
    sessionCursors.value = response.data.session_ids;

    // Generate tasks
    const tasks = await createTasks();
    totalTasks.value = tasks.length;

    assignTasksToWorkers(tasks);
  } catch (error) {
    console.error('Error starting concurrent batch upload:', error);
  }
};

// Step 2: Create tasks (each task contains file, offset, and size)
const createTasks = async () => {
  const tasks: any[] = [];

  // Generate tasks for each file
  files.value.forEach((file, fileIndex) => {
    let offset = 0;
    const sessionId = sessionCursors.value[fileIndex];
    while (offset < file.size) {
      const size = Math.min(allowSize.value, file.size - offset);
      const isLastChunk = offset + size >= file.size;
      const blob = file.slice(offset, offset + size);
      tasks.push({
        file: file,
        fileIndex: fileIndex,
        offset: offset,
        size: size,
        close: isLastChunk,
        sessionId: sessionId,
        blob: blob,
        totalSize: file.size,
      });
      offset += size;
    }
  });

  const sortedTasks = tasks.sort((a, b) => a.offset - b.offset);
  const groupedTasks = sortedTasks.reduce((acc: any, item: any) => {
    if (acc[item.offset]) {
      acc[item.offset] = [...acc[item.offset], item];
    } else {
      acc[item.offset] = [item];
    }
    return acc;
  }, {});

  return Object.values(groupedTasks);
};

// Step 3: Assign tasks to workers
const assignTasksToWorkers = (tasks: any[]) => {
  const workerCount = workers.value;
  const tasksPerWorker = Math.ceil(tasks.length / workerCount);

  for (let i = 0; i < workerCount; i++) {
    const workerTasks = tasks.slice(i * tasksPerWorker, (i + 1) * tasksPerWorker);
    startWorker(workerTasks, i);
  }
};

// Start a worker to process tasks
const startWorker = async (tasks: any[], workerId: number) => {
  console.log(`Worker ${workerId} started with ${tasks.length} tasks`, tasks);

  for (const task of tasks) {
    try {
      await appendBatch(task);
      tasksCompleted.value += 1;

      if (tasksCompleted.value === totalTasks.value) {
        finishBatch().then();
      }
    } catch (error) {
      console.error(`Worker ${workerId} failed on task`, task, error);
    }
  }

  console.log(`Worker ${workerId} completed all tasks`);
};

// Step 4: Append batch upload
const appendBatch = async (tasks: any[]) => {
  const entriesMerge = tasks.map((item: any) => ({
    close: item.close,
    cursor: {
      session_id: item.sessionId,
      offset: item.offset
    },
    length: item.size
  }));

  const blobs = tasks.map((task: any) => task.blob);
  const dataMerge = new Blob(blobs);

  try {
    const response = await axios.post(
        'https://content.dropboxapi.com/2/files/upload_session/append_batch',
        dataMerge,
        {
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              entries: entriesMerge
            })
          }
        }
    );
    console.log(`Appended batch for`, response);
  } catch (error) {
    console.error('Error in append_batch:', error);
  }
};

// Step 5: Finish the batch
const finishBatch = async () => {
  const finishEntries = files.value.map((file, index) => ({
    commit: {
      autorename: false,
      mode: "overwrite",
      mute: true,
      path: `/${file.name}`,
      strict_conflict: false,
    },
    cursor: { offset: file.size, session_id: sessionCursors.value[index] },
  }));

  try {
    const response = await axios.post(
        'https://api.dropboxapi.com/2/files/upload_session/finish_batch_v2',
        { entries: finishEntries },
        {
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json'
          }
        }
    );
    if(response?.data?.entries?.[0]?.['.tag'] === 'success') {
        alert('Upload Success')
        loading.value = false
    }
  } catch (error:any) {
    console.error('Error finishing batch upload:', error.response ? error.response.data : error.message);
  }
};
const clearAllFiles = () => {
  files.value = []
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Dropbox Uploader</h1>
      <div class="mb-4">
        <label for="apiKey" class="block mb-2 font-bold">Dropbox API Key:</label>
        <input
            type="text"
            id="apiKey"
            class="border p-2 w-full focus:outline-0 rounded"
            placeholder="Enter your Dropbox API key"
        />
      </div>
<!--      <button @click="authorize" class="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600">Authorize with Dropbox</button>-->
      <div class="mb-4">
        <label for="apiKey" class="block mb-2 font-bold">Upload File:</label>
        <div
            class="w-full p-10 bg-white rounded-lg shadow-md"
            @dragover.prevent
            @dragenter.prevent
            @dragleave.prevent
            @drop.prevent="handleDrop"
            @dragover="isDragging = true"
            @dragleave="isDragging = false"
            @drop="isDragging = false"
            :class="{ 'border-dashed border-4 border-blue-400': isDragging }"
        >
          <!-- Drag and Drop Area -->
          <div
              class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer"
              @click="triggerFileInput"
          >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
              <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16l-4-4m0 0l4-4m-4 4h18M13 16l4-4m0 0l-4-4m4 4H3"
              />
            </svg>
            <p class="text-gray-500 mt-4">Drag & drop files here, or click to select files</p>
            <input
                type="file"
                class="hidden"
                ref="fileInput"
                multiple
                @change="handleFileSelection"
            />
          </div>
        </div>

        <!-- Selected Files List -->
        <div
            v-if="files.length > 0"
            class="w-full mt-8 bg-white rounded-lg shadow-md p-6"
        >
          <div class="flex items-center mb-4 justify-between">
            <h2 class="text-lg font-semibold text-gray-700">Selected Files</h2>
            <button class="bg-red-600 p-1.5 rounded text-white" @click="clearAllFiles">Clear All</button>
          </div>
          <ul class="space-y-2">
            <li
                v-for="(file, index) in files"
                :key="index"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <span class="text-gray-700">{{ file.name }} ({{ (file.size / 1024 / 1024).toFixed(2) }} MB)</span>
              <button
                  class="text-red-500 hover:text-red-600"
                  @click="removeFile(index)"
              >
                Remove
              </button>
            </li>
          </ul>
        </div>
      </div>
      <!-- Upload Button -->
      <button
          class="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="files.length === 0"
          @click="startConcurrentBatch"
      >
        <span v-if="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24"><g><circle cx="3" cy="12" r="2" fill="currentColor"/><circle cx="21" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="21" r="2" fill="currentColor"/><circle cx="12" cy="3" r="2" fill="currentColor"/><circle cx="5.64" cy="5.64" r="2" fill="currentColor"/><circle cx="18.36" cy="18.36" r="2" fill="currentColor"/><circle cx="5.64" cy="18.36" r="2" fill="currentColor"/><circle cx="18.36" cy="5.64" r="2" fill="currentColor"/><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></g></svg>
        </span>
        <span v-if="!loading">
          Upload Files
        </span>
      </button>
    </div>
  </div>
</template>