'use client';

import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, RotateCcw, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';

import { FALLBACK_META, PLATFORM_META } from './constants';
import type { ThemeMode } from './types';

import { HOT_ITEMS } from '@/enums';
import { useAppStore } from '@/store/useAppStore';

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

type HotKey = App.HotListConfig['value'];

export function CustomizeModal({ isOpen, onClose, theme }: CustomizeModalProps) {
  const hiddenItems = useAppStore(state => state.hiddenItems);
  const setHiddenItems = useAppStore(state => state.setHiddenItems);
  const sortItems = useAppStore(state => state.sortItems);
  const setSortItems = useAppStore(state => state.setSortItems);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'hidden'>('active');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Mapped lists of all platforms in order
  const platformsMapped = useMemo(() => {
    const rawItems = (HOT_ITEMS.items as Array<{ raw: App.HotListConfig }>).map(({ raw }) => raw);
    const byValue = new Map(rawItems.map(item => [item.value, item]));

    const currentOrder = [...sortItems];
    rawItems.forEach(item => {
      if (!currentOrder.includes(item.value)) {
        currentOrder.push(item.value);
      }
    });

    return currentOrder
      .map(value => byValue.get(value))
      .filter((item): item is App.HotListConfig => item !== undefined)
      .map(item => ({
        ...item,
        ...(PLATFORM_META[item.value] || FALLBACK_META),
        isHidden: hiddenItems.includes(item.value),
      }));
  }, [hiddenItems, sortItems]);

  const activePlatforms = useMemo(() => {
    return platformsMapped.filter(p => !p.isHidden);
  }, [platformsMapped]);

  const hiddenPlatforms = useMemo(() => {
    const hidden = platformsMapped.filter(p => p.isHidden);
    if (!searchQuery.trim()) return hidden;
    return hidden.filter(p =>
      p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [platformsMapped, searchQuery]);

  const handleToggleHide = (value: HotKey, shouldHide: boolean) => {
    if (shouldHide) {
      setHiddenItems([...hiddenItems, value]);
    } else {
      setHiddenItems(hiddenItems.filter(item => item !== value));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...sortItems];
    const sourceValue = activePlatforms[draggedIndex].value;
    const targetValue = activePlatforms[index].value;

    const sourceIdxInSort = newOrder.indexOf(sourceValue);
    const targetIdxInSort = newOrder.indexOf(targetValue);

    if (sourceIdxInSort !== -1 && targetIdxInSort !== -1) {
      newOrder[sourceIdxInSort] = targetValue;
      newOrder[targetIdxInSort] = sourceValue;
      setSortItems(newOrder);
      setDraggedIndex(index); // update currently dragged index to match new location
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Up/down arrow fallback handler
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sortItems];
    const targetValue = activePlatforms[index].value;
    const currentIndexInSort = newOrder.indexOf(targetValue);

    if (currentIndexInSort === -1) return;

    const targetIndex = direction === 'up' ? currentIndexInSort - 1 : currentIndexInSort + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    // Swap elements
    const temp = newOrder[currentIndexInSort];
    newOrder[currentIndexInSort] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setSortItems(newOrder);
  };

  const handleReset = () => {
    setHiddenItems([]);
    setSortItems(HOT_ITEMS.values);
    setSearchQuery('');
    setActiveTab('active');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`relative z-10 flex h-[80vh] max-h-[640px] w-full max-w-lg flex-col overflow-hidden rounded-2xl border p-5 shadow-2xl backdrop-blur-xl ${
              theme === 'dark'
                ? 'border-white/[0.08] bg-[#0c0e1e]/90 text-slate-100 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)]'
                : 'border-slate-200 bg-white/95 text-slate-800 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.15)]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-500/10">
              <div>
                <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  定制专属热榜
                </h3>
                <p className={`text-[12px] mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  自定义榜单显示状态与排列顺序，设置将自动同步保存
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark' ? 'text-slate-400 hover:bg-slate-800/80 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-500/5 mt-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('active');
                  setSearchQuery('');
                }}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'active'
                    ? 'border-[#ff8200] text-[#ff8200]'
                    : theme === 'dark'
                      ? 'border-transparent text-slate-400 hover:text-slate-200'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                显示中 ({activePlatforms.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('hidden');
                  setSearchQuery('');
                }}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'hidden'
                    ? 'border-[#ff8200] text-[#ff8200]'
                    : theme === 'dark'
                      ? 'border-transparent text-slate-400 hover:text-slate-200'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                已隐藏 ({hiddenItems.length})
              </button>
            </div>

            {/* Search & Reset (Conditional showing) */}
            <div className="flex items-center gap-2 py-3 border-b border-slate-500/5 shrink-0">
              {activeTab === 'hidden' ? (
                <div className="relative flex-1">
                  <Search className={`size-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    placeholder="在已隐藏榜单中搜索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full py-1.5 pl-9 pr-3 rounded-lg text-xs font-bold shadow-inner outline-none transition ${
                      theme === 'dark'
                        ? 'border border-[#1e2942] bg-[#0b0e1b]/80 text-white placeholder:text-slate-600 focus:border-[#ff8200]/40'
                        : 'border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#ff8200]/40'
                    }`}
                  />
                </div>
              ) : (
                <div className="flex-1 text-[11px] font-bold text-slate-400 italic">
                  💡 提示：拖拽左侧句柄或使用箭头调整卡片顺序
                </div>
              )}

              <button
                type="button"
                onClick={handleReset}
                title="恢复默认配置"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer active:scale-95 ${
                  theme === 'dark'
                    ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <RotateCcw className="size-3.5" />
                <span>重置默认</span>
              </button>
            </div>

            {/* List Panels */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-500/5 custom-scrollbar pr-1 py-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {activeTab === 'active' ? (
                  activePlatforms.map((platform, index) => {
                    const isFirst = index === 0;
                    const isLast = index === activePlatforms.length - 1;
                    return (
                      <motion.div
                        key={platform.value}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        onDragOver={(e) => handleDragOver(e, index)}
                        className={`flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-slate-500/5 transition-colors group/row border border-transparent ${
                          draggedIndex === index
                            ? theme === 'dark'
                              ? 'bg-orange-500/10 border-orange-500/20'
                              : 'bg-orange-50 border-orange-200'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Drag Handle */}
                          <div
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragEnd={handleDragEnd}
                            title="拖动调整顺序"
                            className={`cursor-grab active:cursor-grabbing p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition ${
                              draggedIndex === index ? 'text-orange-500' : ''
                            }`}
                          >
                            <GripVertical className="size-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[13.5px] font-bold truncate">
                              {platform.label}
                            </p>
                            <p className="text-[11px] truncate opacity-50 font-medium">
                              {platform.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                          {/* Fallback micro buttons for mobile/desktop arrows */}
                          <div className="flex items-center gap-0.5 border border-slate-500/10 rounded-lg p-0.5 bg-slate-500/5">
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={() => handleMove(index, 'up')}
                              className={`p-1 rounded-md transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                                theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              <ArrowUp className="size-3" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={() => handleMove(index, 'down')}
                              className={`p-1 rounded-md transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                                theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              <ArrowDown className="size-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleHide(platform.value, true)}
                            title="隐藏该榜单"
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              theme === 'dark'
                                ? 'border-red-500/15 bg-red-500/5 text-red-400 hover:bg-red-500/25'
                                : 'border-red-100 bg-red-50/50 text-red-500 hover:bg-red-100'
                            }`}
                          >
                            <EyeOff className="size-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  hiddenPlatforms.map((platform) => (
                    <motion.div
                      key={platform.value}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-slate-500/5 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-bold truncate opacity-60">
                          {platform.label}
                        </p>
                        <p className="text-[11px] truncate opacity-30 font-medium">
                          {platform.subtitle}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleHide(platform.value, false)}
                        title="重新显示该榜单"
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          theme === 'dark'
                            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25'
                            : 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        <Eye className="size-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {activeTab === 'active' && activePlatforms.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-sm font-bold text-slate-400">所有榜单均已隐藏</p>
                  <p className="text-xs text-slate-400/60 mt-1">请前往“已隐藏”标签重新开启</p>
                </div>
              )}

              {activeTab === 'hidden' && hiddenPlatforms.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-sm font-bold text-slate-400">没有已隐藏的榜单</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
