import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { showToast } from "../utils/toast";

async function copyText(text: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    const copied = document.execCommand("copy");
    if (!copied) throw new Error("copy command failed");
  } finally {
    textarea.remove();
  }
}

type CopyButtonProps = {
  getText?: () => Promise<string> | string;
  label: string;
  text?: string;
};

export function CopyButton({ getText, label, text = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      const nextText = getText ? await getText() : text;
      await copyText(nextText);
      setCopied(true);
      showToast({ message: "복사 완료", variant: "success" });
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
      showToast({ message: "복사 실패", variant: "error" });
    }
  }

  return (
    <button className="icon-button" type="button" onClick={copyCode} aria-label={`${label} 코드 복사`}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}
