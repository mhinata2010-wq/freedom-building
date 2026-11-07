/** Space pans the canvas only when it would not activate a native UI control. */
export function shouldUseSpaceForPan(event, activeElement) {
 if (event.key !== ' ' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return false;
 const tag=activeElement?.tagName?.toLowerCase();
 if (['button','a','summary','input','textarea','select','option'].includes(tag) || activeElement?.isContentEditable) return false;
 if (activeElement?.closest?.('[role="button"],[role="tab"],[role="link"],[contenteditable="true"]')) return false;
 return true;
}
