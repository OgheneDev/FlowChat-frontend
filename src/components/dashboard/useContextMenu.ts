import { useState, useRef, useEffect } from "react";

type ContextEvent = React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>;

const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: any;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside context menu
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // Handle scroll prevention and scroll-to-close
  useEffect(() => {
    if (!contextMenu) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setContextMenu(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      setContextMenu(null);
    };

    // Prevent scrolling when context menu is open
    document.body.style.overflow = 'hidden';
    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("touchmove", handleTouchMove);
      document.body.style.overflow = '';
    };
  }, [contextMenu]);

  const showContextMenu = (e: ContextEvent, msg: any) => {
    e.preventDefault();

    let clientX: number;
    let clientY: number;
    let target: HTMLElement;

    if ("touches" in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      target = e.target as HTMLElement;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
      target = e.currentTarget as HTMLElement;
    }

    // Find the message container element
    const messageElement = target.closest('.message-item') as HTMLElement;
    
    if (!messageElement) {
      // Fallback to original positioning if message element not found
      setContextMenu({ x: clientX, y: clientY, message: msg });
      return;
    }

    const messageRect = messageElement.getBoundingClientRect();
    const menuWidth = 210;
    const menuHeight = 400; // Approximate height of context menu
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate X position (horizontal)
    let x = clientX;
    
    // Keep menu within viewport horizontally
    if (x + menuWidth > viewportWidth - padding) {
      x = viewportWidth - menuWidth - padding;
    }
    x = Math.max(padding, x);

    // Calculate Y position (vertical) - WhatsApp style
    // Start at the top of the message and go upward
    let y = messageRect.top - 8; // 8px offset from message top
    
    // Check if menu would go above viewport
    if (y - menuHeight < padding) {
      // If not enough space above, position below the message instead
      y = messageRect.bottom + 8;
      
      // If also not enough space below, position to fit in viewport
      if (y + menuHeight > viewportHeight - padding) {
        y = viewportHeight - menuHeight - padding;
      }
    } else {
      // Position menu to end at the message top (menu goes upward)
      y = y - menuHeight + 8;
    }

    // Ensure menu doesn't go above viewport
    y = Math.max(padding, y);
    
    // Ensure menu doesn't go below viewport
    if (y + menuHeight > viewportHeight - padding) {
      y = viewportHeight - menuHeight - padding;
    }

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