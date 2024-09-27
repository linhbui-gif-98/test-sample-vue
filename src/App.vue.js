import { ref } from 'vue';
import axios from 'axios';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
const clientId = 'v9678cdu0s1f86e';
// State variables
const accessToken = ref('sl.B9uDbuo025CVEbOYZXR7Qx1AIXi7j33Vtq3SdZw54AWlypzNXQK3NcYGIJ51SneixJB5f52PjM0__175pd8qjLFAplkpu-DCfadUgwF6FRaqIJIR6aUhBmOXarRJ7cB1AcP-gvLDwZLfp0AwFqhd');
const isDragging = ref(false);
// Reference for file input
const fileInput = ref(null);
const files = ref([]);
const sessionCursors = ref([]);
const workers = ref(10);
const tasksCompleted = ref(0);
const totalTasks = ref(0);
const allowSize = ref(4 * 1024 * 1024);
const loading = ref(false);
// Methods
const triggerFileInput = () => {
    fileInput.value?.click();
};
const handleFileSelection = (event) => {
    const input = event.target;
    if (input.files) {
        files.value = Array.from(input.files);
    }
};
const handleDrop = (event) => {
    if (event.dataTransfer?.files) {
        files.value = Array.from(event.dataTransfer.files);
    }
};
const removeFile = (index) => {
    files.value.splice(index, 1);
};
// Step 1: Start concurrent batch sessions
const startConcurrentBatch = async () => {
    if (files.value.length === 0) {
        alert('Please select files to upload.');
        return;
    }
    try {
        loading.value = true;
        // Start the batch session, specifying the number of sessions equal to the number of files
        const response = await axios.post('https://api.dropboxapi.com/2/files/upload_session/start_batch', {
            session_type: 'concurrent',
            num_sessions: files.value.length // Number of sessions to match the number of files
        }, {
            headers: {
                Authorization: `Bearer ${accessToken.value}`,
                'Content-Type': 'application/json'
            }
        });
        // Store session cursors for each file
        sessionCursors.value = response.data.session_ids;
        // Generate tasks
        const tasks = await createTasks();
        totalTasks.value = tasks.length;
        assignTasksToWorkers(tasks);
    }
    catch (error) {
        console.error('Error starting concurrent batch upload:', error);
    }
};
// Step 2: Create tasks (each task contains file, offset, and size)
const createTasks = async () => {
    const tasks = [];
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
    const groupedTasks = sortedTasks.reduce((acc, item) => {
        if (acc[item.offset]) {
            acc[item.offset] = [...acc[item.offset], item];
        }
        else {
            acc[item.offset] = [item];
        }
        return acc;
    }, {});
    return Object.values(groupedTasks);
};
// Step 3: Assign tasks to workers
const assignTasksToWorkers = (tasks) => {
    const workerCount = workers.value;
    const tasksPerWorker = Math.ceil(tasks.length / workerCount);
    for (let i = 0; i < workerCount; i++) {
        const workerTasks = tasks.slice(i * tasksPerWorker, (i + 1) * tasksPerWorker);
        startWorker(workerTasks, i);
    }
};
// Start a worker to process tasks
const startWorker = async (tasks, workerId) => {
    console.log(`Worker ${workerId} started with ${tasks.length} tasks`, tasks);
    for (const task of tasks) {
        try {
            await appendBatch(task);
            tasksCompleted.value += 1;
            if (tasksCompleted.value === totalTasks.value) {
                finishBatch().then();
            }
        }
        catch (error) {
            console.error(`Worker ${workerId} failed on task`, task, error);
        }
    }
    console.log(`Worker ${workerId} completed all tasks`);
};
// Step 4: Append batch upload
const appendBatch = async (tasks) => {
    const entriesMerge = tasks.map((item) => ({
        close: item.close,
        cursor: {
            session_id: item.sessionId,
            offset: item.offset
        },
        length: item.size
    }));
    const blobs = tasks.map((task) => task.blob);
    const dataMerge = new Blob(blobs);
    try {
        const response = await axios.post('https://content.dropboxapi.com/2/files/upload_session/append_batch', dataMerge, {
            headers: {
                Authorization: `Bearer ${accessToken.value}`,
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify({
                    entries: entriesMerge
                })
            }
        });
        console.log(`Appended batch for`, response);
    }
    catch (error) {
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
        const response = await axios.post('https://api.dropboxapi.com/2/files/upload_session/finish_batch_v2', { entries: finishEntries }, {
            headers: {
                Authorization: `Bearer ${accessToken.value}`,
                'Content-Type': 'application/json'
            }
        });
        if (response?.data?.entries?.[0]?.['.tag'] === 'success') {
            alert('Upload Success');
            loading.value = false;
        }
    }
    catch (error) {
        console.error('Error finishing batch upload:', error.response ? error.response.data : error.message);
    }
};
const clearAllFiles = () => {
    files.value = [];
};
const __VLS_fnComponent = (await import('vue')).defineComponent({});
;
let __VLS_functionalComponentProps;
function __VLS_template() {
    const __VLS_ctx = {};
    const __VLS_localComponents = {
        ...{},
        ...{},
        ...__VLS_ctx,
    };
    let __VLS_components;
    const __VLS_localDirectives = {
        ...{},
        ...__VLS_ctx,
    };
    let __VLS_directives;
    let __VLS_styleScopedClasses;
    let __VLS_resolvedLocalAndGlobalComponents;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("min-h-screen flex items-center justify-center") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("container mx-auto p-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({ ...{ class: ("text-2xl font-bold mb-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mb-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ for: ("apiKey"), ...{ class: ("block mb-2 font-bold") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ type: ("text"), id: ("apiKey"), ...{ class: ("border p-2 w-full focus:outline-0 rounded") }, placeholder: ("Enter your Dropbox API key"), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("mb-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ for: ("apiKey"), ...{ class: ("block mb-2 font-bold") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onDragover: () => { } }, ...{ onDragenter: () => { } }, ...{ onDragleave: () => { } }, ...{ onDrop: (__VLS_ctx.handleDrop) }, ...{ onDragover: (...[$event]) => {
                __VLS_ctx.isDragging = true;
            } }, ...{ onDragleave: (...[$event]) => {
                __VLS_ctx.isDragging = false;
            } }, ...{ onDrop: (...[$event]) => {
                __VLS_ctx.isDragging = false;
            } }, ...{ class: ("w-full p-10 bg-white rounded-lg shadow-md") }, ...{ class: (({ 'border-dashed border-4 border-blue-400': __VLS_ctx.isDragging })) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ onClick: (__VLS_ctx.triggerFileInput) }, ...{ class: ("flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({ xmlns: ("http://www.w3.org/2000/svg"), ...{ class: ("h-12 w-12 text-gray-400") }, fill: ("none"), viewBox: ("0 0 24 24"), stroke: ("currentColor"), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.path)({ "stroke-linecap": ("round"), "stroke-linejoin": ("round"), "stroke-width": ("2"), d: ("M7 16l-4-4m0 0l4-4m-4 4h18M13 16l4-4m0 0l-4-4m4 4H3"), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({ ...{ class: ("text-gray-500 mt-4") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onChange: (__VLS_ctx.handleFileSelection) }, type: ("file"), ...{ class: ("hidden") }, ref: ("fileInput"), multiple: (true), });
    // @ts-ignore navigation for `const fileInput = ref()`
    __VLS_ctx.fileInput;
    if (__VLS_ctx.files.length > 0) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("w-full mt-8 bg-white rounded-lg shadow-md p-6") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("flex items-center mb-4 justify-between") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({ ...{ class: ("text-lg font-semibold text-gray-700") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.clearAllFiles) }, ...{ class: ("bg-red-600 p-1.5 rounded text-white") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({ ...{ class: ("space-y-2") }, });
        for (const [file, index] of __VLS_getVForSourceType((__VLS_ctx.files))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({ key: ((index)), ...{ class: ("flex items-center justify-between p-3 bg-gray-50 rounded-md") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({ ...{ class: ("text-gray-700") }, });
            (file.name);
            ((file.size / 1024 / 1024).toFixed(2));
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.files.length > 0)))
                            return;
                        __VLS_ctx.removeFile(index);
                    } }, ...{ class: ("text-red-500 hover:text-red-600") }, });
        }
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.startConcurrentBatch) }, ...{ class: ("mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50") }, disabled: ((__VLS_ctx.files.length === 0)), });
    if (__VLS_ctx.loading) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({ xmlns: ("http://www.w3.org/2000/svg"), width: ("2em"), height: ("2em"), viewBox: ("0 0 24 24"), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.g, __VLS_intrinsicElements.g)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.circle)({ cx: ("3"), cy: ("12"), r: ("2"), fill: ("currentColor"), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.circle)({ cx: ("21"), cy: ("12"), r: ("2"), fill: ("currentColor"), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.circle)({ cx: ("12"), cy: ("21"), r: ("2"), fill: ("currentColor"), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.circle)({ cx: ("12"), cy: ("3"), r: ("2"), fill: ("currentColor"), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.circle)({ cx: ("5.64"), cy: ("5.64"), r: ("2"), fill: ("currentColor"), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.circle)({ cx: ("18.36"), cy: ("18.36"), r: ("2"), fill: ("currentColor"), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.circle)({ cx: ("5.64"), cy: ("18.36"), r: ("2"), fill: ("currentColor"), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.circle)({ cx: ("18.36"), cy: ("5.64"), r: ("2"), fill: ("currentColor"), });
        __VLS_elementAsFunction(__VLS_intrinsicElements.animateTransform)({ attributeName: ("transform"), dur: ("1.5s"), repeatCount: ("indefinite"), type: ("rotate"), values: ("0 12 12;360 12 12"), });
    }
    if (!__VLS_ctx.loading) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    __VLS_styleScopedClasses['min-h-screen'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['container'];
    __VLS_styleScopedClasses['mx-auto'];
    __VLS_styleScopedClasses['p-4'];
    __VLS_styleScopedClasses['text-2xl'];
    __VLS_styleScopedClasses['font-bold'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['block'];
    __VLS_styleScopedClasses['mb-2'];
    __VLS_styleScopedClasses['font-bold'];
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['p-2'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['focus:outline-0'];
    __VLS_styleScopedClasses['rounded'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['block'];
    __VLS_styleScopedClasses['mb-2'];
    __VLS_styleScopedClasses['font-bold'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['p-10'];
    __VLS_styleScopedClasses['bg-white'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['shadow-md'];
    __VLS_styleScopedClasses['border-dashed'];
    __VLS_styleScopedClasses['border-4'];
    __VLS_styleScopedClasses['border-blue-400'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['flex-col'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-center'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['border-2'];
    __VLS_styleScopedClasses['border-dashed'];
    __VLS_styleScopedClasses['border-gray-300'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['cursor-pointer'];
    __VLS_styleScopedClasses['h-12'];
    __VLS_styleScopedClasses['w-12'];
    __VLS_styleScopedClasses['text-gray-400'];
    __VLS_styleScopedClasses['text-gray-500'];
    __VLS_styleScopedClasses['mt-4'];
    __VLS_styleScopedClasses['hidden'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['mt-8'];
    __VLS_styleScopedClasses['bg-white'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['shadow-md'];
    __VLS_styleScopedClasses['p-6'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['mb-4'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['text-lg'];
    __VLS_styleScopedClasses['font-semibold'];
    __VLS_styleScopedClasses['text-gray-700'];
    __VLS_styleScopedClasses['bg-red-600'];
    __VLS_styleScopedClasses['p-1.5'];
    __VLS_styleScopedClasses['rounded'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['space-y-2'];
    __VLS_styleScopedClasses['flex'];
    __VLS_styleScopedClasses['items-center'];
    __VLS_styleScopedClasses['justify-between'];
    __VLS_styleScopedClasses['p-3'];
    __VLS_styleScopedClasses['bg-gray-50'];
    __VLS_styleScopedClasses['rounded-md'];
    __VLS_styleScopedClasses['text-gray-700'];
    __VLS_styleScopedClasses['text-red-500'];
    __VLS_styleScopedClasses['hover:text-red-600'];
    __VLS_styleScopedClasses['mt-4'];
    __VLS_styleScopedClasses['px-6'];
    __VLS_styleScopedClasses['py-3'];
    __VLS_styleScopedClasses['bg-blue-500'];
    __VLS_styleScopedClasses['text-white'];
    __VLS_styleScopedClasses['rounded-lg'];
    __VLS_styleScopedClasses['shadow-md'];
    __VLS_styleScopedClasses['hover:bg-blue-600'];
    __VLS_styleScopedClasses['transition'];
    __VLS_styleScopedClasses['disabled:bg-gray-400'];
    __VLS_styleScopedClasses['disabled:cursor-not-allowed'];
    __VLS_styleScopedClasses['disabled:opacity-50'];
    var __VLS_slots;
    var __VLS_inheritedAttrs;
    const __VLS_refs = {
        "fileInput": __VLS_nativeElements['input'],
    };
    var $refs;
    return {
        slots: __VLS_slots,
        refs: $refs,
        attrs: {},
    };
}
;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isDragging: isDragging,
            fileInput: fileInput,
            files: files,
            loading: loading,
            triggerFileInput: triggerFileInput,
            handleFileSelection: handleFileSelection,
            handleDrop: handleDrop,
            removeFile: removeFile,
            startConcurrentBatch: startConcurrentBatch,
            clearAllFiles: clearAllFiles,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
