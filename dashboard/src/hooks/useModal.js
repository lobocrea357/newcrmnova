import { useCallback, useState } from "react";

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState(null); // Estado para almacenar datos

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  const openWithData = useCallback((newData) => {
    setData(newData);
    open();
  }, []);

  const createModalSaveHandler = useCallback(
    (refetchFunction) => {
      return () => {
        if (refetchFunction && typeof refetchFunction === "function") {
          refetchFunction();
        }
        close();
      };
    },
    [close]
  );

  return {
    isOpen,
    open,
    data,
    close,
    toggle,
    openWithData,
    createModalSaveHandler,
  };
};
