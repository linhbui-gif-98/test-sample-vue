import { defineProps, defineEmits } from 'vue';
const { defineSlots, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
let __VLS_typeProps;
const props = withDefaults(defineProps(), {
    size: 'medium',
});
const emits = defineEmits(['update:modelValue', 'focus', 'blur', 'keyup']);
const handleInputChange = (e) => {
    const target = e.target;
    emits('update:modelValue', target.value);
};
const handleInputFocus = (e) => emits('focus', e);
const handleInputBlur = (e) => emits('blur', e);
const handleInputKeyup = (e) => emits('keyup', e);
const __VLS_withDefaultsArg = (function (t) { return t; })({
    size: 'medium',
});
const __VLS_fnComponent = (await import('vue')).defineComponent({
    emits: {},
});
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ ...{ onInput: (__VLS_ctx.handleInputChange) }, ...{ onKeyup: (__VLS_ctx.handleInputKeyup) }, ...{ onFocus: (__VLS_ctx.handleInputFocus) }, ...{ onBlur: (__VLS_ctx.handleInputBlur) }, ...{ class: ("border border-gray-400 border-solid w-full p-[10px_15px] rounded") }, value: ((__VLS_ctx.modelValue)), ...{ class: ((__VLS_ctx.size)) }, type: ((__VLS_ctx.type)), placeholder: ((__VLS_ctx.placeholder)), });
    __VLS_styleScopedClasses['border'];
    __VLS_styleScopedClasses['border-gray-400'];
    __VLS_styleScopedClasses['border-solid'];
    __VLS_styleScopedClasses['w-full'];
    __VLS_styleScopedClasses['p-[10px_15px]'];
    __VLS_styleScopedClasses['rounded'];
    var __VLS_slots;
    var __VLS_inheritedAttrs;
    const __VLS_refs = {};
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
            handleInputChange: handleInputChange,
            handleInputFocus: handleInputFocus,
            handleInputBlur: handleInputBlur,
            handleInputKeyup: handleInputKeyup,
        };
    },
    emits: {},
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    __typeProps: {},
    props: {},
});
;
