"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<typeof inventoryItems[0] | null>(null);
  
  const inventoryItems = [
    { id: 1, icon: '✏️', name: 'Minecraft Painter', route: '/mc-painter' },
    { id: 2, icon: '', name: '', route: '' },
    { id: 3, icon: '', name: '', route: '' },
    { id: 4, icon: '', name: '', route: '' },
    { id: 5, icon: '🖥️', name: 'Device detector', route: '/detection' },
    { id: 6, icon: '', name: '', route: '' },
    { id: 7, icon: '', name: '', route: '' },
    { id: 8, icon: '', name: '', route: '' },
    { id: 9, icon: '🗯️', name: 'Artrans Tool', route: '/artrans' },
  ];

  const handleItemClick = (item: typeof inventoryItems[0]) => {
    if (selectedItem?.id === item.id) {
      if (item.route) {
        router.push(item.route);
      }
    } else {
      setSelectedItem(item);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-8">
      <div className="relative">
        {selectedItem && selectedItem.name && (
          <div className="absolute -top-8 sm:-top-10 left-1/2 transform -translate-x-1/2 bg-zinc-800 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm whitespace-nowrap z-10">
            {selectedItem.name}
          </div>
        )}
        <div className="flex gap-0">
          {inventoryItems.map((item) => (
            <div
              key={item.id}
              className={`w-12 h-12 sm:w-16 sm:h-16 border-2 border-zinc-800 bg-zinc-700 flex items-center justify-center text-xl sm:text-2xl relative cursor-pointer hover:bg-zinc-600 transition-colors ${
                selectedItem?.id === item.id ? 'bg-zinc-500' : ''
              }`}
              style={{
                boxShadow: 'inset -2px -2px 0px rgba(0,0,0,0.5), inset 2px 2px 0px rgba(255,255,255,0.2)',
              }}
              onClick={() => handleItemClick(item)}
            >
              {item.icon && <span className="drop-shadow-lg">{item.icon}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
