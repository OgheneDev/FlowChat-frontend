import { useState, useRef, useEffect } from "react";

type ContextEvent = React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>;

const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: any;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const showContextMenu = (e: ContextEvent, msg: any) => {
    e.preventDefault();

    let clientX: number;
    let clientY: number;

    if ("touches" in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const menuWidth = 210;
    const menuHeight = 300;
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = clientX;
    let y = clientY;

    if (x + menuWidth > viewportWidth - padding) {
      x = viewportWidth - menuWidth - padding;
    }
    if (y + menuHeight > viewportHeight - padding) {
      y = viewportHeight - menuHeight - padding;
    }

    x = Math.max(padding, x);
    y = Math.max(padding, y); 

    setContextMenu({ x, y, message: msg });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, msg: any) => {
    const timeout = setTimeout(() => showContextMenu(e, msg), 600);
    const cancel = () => clearTimeout(timeout);
    document.addEventListener("touchend", cancel, { once: true });
  };

  return { contextMenu, setContextMenu, contextMenuRef, showContextMenu, handleTouchStart };
};

export default useContextMenu;