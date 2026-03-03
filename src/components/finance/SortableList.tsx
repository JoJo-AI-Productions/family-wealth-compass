import { useState, useRef, useCallback } from 'react';

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderActions?: (item: T) => React.ReactNode;
}

export default function SortableList<T extends { id: string }>({
  items, onReorder, renderItem, renderActions,
}: SortableListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      setIsDragging(false);
      return;
    }
    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, moved);
    onReorder(newItems);
    setDragIndex(null);
    setOverIndex(null);
    setIsDragging(false);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
    setIsDragging(false);
  };

  // Touch-based reorder
  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    longPressTimer.current = setTimeout(() => {
      handleDragStart(index);
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dy > 10 && !isDragging) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    if (!isDragging || dragIndex === null) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target) {
      const itemEl = (target as HTMLElement).closest('[data-sort-index]');
      if (itemEl) {
        const idx = parseInt(itemEl.getAttribute('data-sort-index') || '-1');
        if (idx >= 0) setOverIndex(idx);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isDragging && dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const newItems = [...items];
      const [moved] = newItems.splice(dragIndex, 1);
      newItems.splice(overIndex, 0, moved);
      onReorder(newItems);
    }
    setDragIndex(null);
    setOverIndex(null);
    setIsDragging(false);
  };

  return (
    <div className="space-y-1" onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {items.map((item, index) => (
        <div
          key={item.id}
          ref={el => { itemRefs.current[index] = el; }}
          data-sort-index={index}
          draggable={isDragging && dragIndex === index}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={() => handleDrop(index)}
          onDragEnd={handleDragEnd}
          onTouchStart={(e) => handleTouchStart(index, e)}
          className={`flex items-center justify-between py-2 px-2 rounded-lg transition-all select-none ${
            dragIndex === index ? 'opacity-50 bg-accent/20' : ''
          } ${overIndex === index && dragIndex !== index ? 'border-t-2 border-primary' : ''}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-muted-foreground cursor-grab active:cursor-grabbing text-xs">⠿</span>
            {renderItem(item, index)}
          </div>
          {renderActions?.(item)}
        </div>
      ))}
    </div>
  );
}
