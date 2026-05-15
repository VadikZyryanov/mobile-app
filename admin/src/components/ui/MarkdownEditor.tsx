import MDEditor from '@uiw/react-md-editor';

export interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  height?: number;
  preview?: 'edit' | 'live' | 'preview';
}

export function MarkdownEditor({
  value,
  onChange,
  height = 400,
  preview = 'live',
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? '')}
        height={height}
        preview={preview}
      />
    </div>
  );
}
