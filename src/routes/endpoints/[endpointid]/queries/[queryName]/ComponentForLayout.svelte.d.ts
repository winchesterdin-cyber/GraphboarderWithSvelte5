import 'highlight.js/styles/base16/solarized-dark.css';
interface Props {
    prefix?: string;
    enableMultiRowSelectionState?: boolean;
    currentQMS_info?: any;
    rowSelectionState: any;
    onRowSelectionChange?: (detail: any) => void;
    onRowClicked?: (detail: any) => void;
    children?: import('svelte').Snippet;
}
declare const ComponentForLayout: import("svelte").Component<Props, {}, "">;
type ComponentForLayout = ReturnType<typeof ComponentForLayout>;
export default ComponentForLayout;
