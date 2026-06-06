import React from "react";

interface ImportModalsProps {
    isConfirmOpen: boolean;
    isPasteOpen: boolean;
    pasteText: string;
    onPasteTextChange: (text: string) => void;
    onConfirmImport: () => void;
    onCancelConfirm: () => void;
    onPasteImport: () => void;
    onClosePaste: () => void;
}

export default function ImportModals({
    isConfirmOpen,
    isPasteOpen,
    pasteText,
    onPasteTextChange,
    onConfirmImport,
    onCancelConfirm,
    onPasteImport,
    onClosePaste,
}: ImportModalsProps) {
    return (
        <>
            {isConfirmOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface p-6 rounded-2xl w-full max-w-sm border border-outline-variant/20 shadow-xl">
                        <h3 className="text-xl font-bold text-on-surface mb-2">确认导入</h3>
                        <p className="text-on-surface-variant font-medium mb-6">
                            同名任务将覆盖，不同名任务会合并保留，确定导入吗？
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg font-medium transition-colors"
                                onClick={onCancelConfirm}
                            >
                                取消
                            </button>
                            <button
                                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-px transition-all"
                                onClick={onConfirmImport}
                            >
                                确定导入
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPasteOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface p-6 rounded-2xl w-full max-w-lg border border-outline-variant/20 shadow-xl">
                        <h3 className="text-xl font-bold text-on-surface mb-4">粘贴 JSON 导入</h3>
                        <textarea
                            className="w-full h-64 p-3 bg-surface-container text-on-surface rounded-xl border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm custom-scrollbar resize-none mb-6"
                            placeholder="在此粘贴任务数据的 JSON..."
                            value={pasteText}
                            onChange={(e) => onPasteTextChange(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg font-medium transition-colors"
                                onClick={onClosePaste}
                            >
                                取消
                            </button>
                            <button
                                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-px transition-all disabled:opacity-50"
                                disabled={!pasteText.trim()}
                                onClick={onPasteImport}
                            >
                                导入
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
