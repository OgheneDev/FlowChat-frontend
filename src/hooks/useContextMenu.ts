import { useState, useRef, useEffect } from "react";

type ContextEvent = React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>;

const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: any;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef({ x: 0, y: 0 });

  // Check if device is mobile
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
    // On mobile, don't show context menu - use selection mode instead
    if (isMobile) {
      return;
    }

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
    // Clear any existing timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      // Trigger long press action (will be handled by parent component)
      const event = new CustomEvent('messageLongPress', { 
        detail: { message: msg } 
      });
      window.dispatchEvent(event);
      longPressTimer.current = null;
    }, 500); // 500ms for long press
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // Cancel long press if user moves finger too much
    if (longPressTimer.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      
      // If moved more than 10px, cancel long press
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    // Clear the long press timer if touch ends
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return { 
    contextMenu, 
    setContextMenu, 
    contextMenuRef, 
    showContextMenu, 
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};

export default useContextMenu;