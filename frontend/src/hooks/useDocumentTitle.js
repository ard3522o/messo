import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · IIIT Mess` : 'IIIT Mess · Smart Mess Management';
  }, [title]);
}

export default useDocumentTitle;
