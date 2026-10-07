import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { SelectScreen } from './screens/SelectScreen';
import { CustomizeScreen } from './screens/CustomizeScreen';
import { ResultScreen } from './screens/ResultScreen';
import { CompareScreen } from './screens/CompareScreen';
import { LookbookScreen } from './screens/LookbookScreen';
import { ImageGuardianScreen } from './screens/ImageGuardianScreen';
import { LoadingState, ErrorState } from './components/StatesFeedback';
import { RemixCustomization, SavedLook } from './types/vietphuc';

export function App() {
  const shouldReduceMotion = useReducedMotion();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'home' | 'select' | 'customize' | 'result' | 'compare' | 'lookbook' | 'image-guardian'>('home');
  
  // Selected Outfit State
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>('ao_ngu_than_tay_chen');

  // Single Unified Customization State (purposeId, remixLevel, colorSchemeId, selectedAccessoryIds, weather)
  const [customization, setCustomization] = useState<RemixCustomization>({
    purposeId: 'chup_ky_yeu',
    remixLevel: 2,
    colorSchemeId: 'men-lam-chu-dau',
    selectedAccessoryIds: [],
    weather: {
      season: 'thu',
      temperature: 'mat_me',
      timeOfDay: 'buoi_sang',
    },
  });

  // Data Collections State (Lookbook starts empty)
  const [lookbook, setLookbook] = useState<SavedLook[]>([]);
  const [compareOutfitIds, setCompareOutfitIds] = useState<string[]>([
    'ao_ngu_than_tay_chen',
    'ao_tac',
  ]);

  // Modals & Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handlers
  const handleStartRemix = (outfitId?: string) => {
    if (outfitId) {
      setSelectedOutfitId(outfitId);
    }
    setCurrentTab('select');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCustomization = (updated: Partial<RemixCustomization>) => {
    setCustomization((prev) => ({ ...prev, ...updated }));
  };

  const handleGenerateResult = () => {
    setIsLoading(true);
    // Smooth transition
    setTimeout(() => {
      setIsLoading(false);
      setCurrentTab('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };

  const handleSaveToLookbook = (newLook: SavedLook) => {
    const exists = lookbook.some(
      (l) =>
        l.outfitId === newLook.outfitId &&
        l.purposeId === newLook.purposeId &&
        l.customization.remixLevel === newLook.customization.remixLevel &&
        l.customization.colorSchemeId === newLook.customization.colorSchemeId
    );
    if (!exists) {
      setLookbook([newLook, ...lookbook]);
      showToast('Đã lưu bản phối vào Lookbook cá nhân!');
    } else {
      showToast('Bản phối này đã có trong Lookbook của bạn.');
    }
  };

  const handleDeleteLook = (id: string) => {
    setLookbook(lookbook.filter((l) => l.id !== id));
    showToast('Đã xóa bản phối khỏi Lookbook.');
  };

  const handleRemixLook = (look: SavedLook) => {
    setSelectedOutfitId(look.outfitId);
    setCustomization(look.customization);
    setCurrentTab('customize');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCompare = (id: string) => {
    if (compareOutfitIds.includes(id)) {
      setCompareOutfitIds(compareOutfitIds.filter((x) => x !== id));
    } else {
      if (compareOutfitIds.length >= 3) {
        showToast('Tối đa so sánh cùng lúc 3 trang phục.');
        return;
      }
      setCompareOutfitIds([...compareOutfitIds, id]);
      showToast(`Đã thêm vào So sánh.`);
    }
  };

  const isCurrentLookSaved = lookbook.some(
    (l) =>
      l.outfitId === selectedOutfitId &&
      l.purposeId === customization.purposeId &&
      l.customization.remixLevel === customization.remixLevel &&
      l.customization.colorSchemeId === customization.colorSchemeId
  );

  const screenTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  return (
    <div className="min-h-screen heritage-paper-bg text-[#161A1D] flex flex-col font-sans selection:bg-[#B93826] selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          setCurrentTab(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        lookbookCount={lookbook.length}
        compareCount={compareOutfitIds.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 pt-5 sm:pt-8 pb-24 md:pb-12">
        {/* Error Banner if any */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={screenTransition}
              className="mb-4"
            >
              <ErrorState
                message={errorMessage}
                onRetry={() => setErrorMessage(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Loading Feedback & Screen Routing with AnimatePresence */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="global-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={screenTransition}
            >
              <LoadingState
                message="Đang tổng hợp bản phối Việt Phục Remix..."
                subMessage="Đối chiếu quy chuẩn văn hoá và cấu trúc nẹp cổ, tay áo"
              />
            </motion.div>
          ) : (
            <motion.div
              key={currentTab}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={screenTransition}
            >
              {currentTab === 'home' && (
                <HomeScreen
                  onStartRemix={handleStartRemix}
                  onOpenLookbook={() => setCurrentTab('lookbook')}
                  onOpenCompare={() => setCurrentTab('compare')}
                  onOpenImageGuardian={() => setCurrentTab('image-guardian')}
                />
              )}

              {currentTab === 'select' && (
                <SelectScreen
                  selectedOutfitId={selectedOutfitId}
                  onSelectOutfit={(id) => {
                    setSelectedOutfitId(id);
                    setCustomization((prev) => ({ ...prev, selectedAccessoryIds: [] }));
                  }}
                  onContinue={() => {
                    setCurrentTab('customize');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {currentTab === 'customize' && (
                <CustomizeScreen
                  customization={customization}
                  selectedOutfitId={selectedOutfitId}
                  onChangeCustomization={handleUpdateCustomization}
                  onBack={() => {
                    setCurrentTab('select');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onGenerateResult={handleGenerateResult}
                />
              )}

              {currentTab === 'result' && (
                <ResultScreen
                  selectedOutfitId={selectedOutfitId}
                  customization={customization}
                  onBackToCustomize={() => {
                    setCurrentTab('customize');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSaveToLookbook={handleSaveToLookbook}
                  onAddToCompare={handleToggleCompare}
                  isSavedInLookbook={isCurrentLookSaved}
                  isInCompare={compareOutfitIds.includes(selectedOutfitId)}
                  onNavigateToLookbook={() => setCurrentTab('lookbook')}
                  onNavigateToCompare={() => setCurrentTab('compare')}
                  onOpenImageGuardian={(outfitId) => {
                    if (outfitId) setSelectedOutfitId(outfitId);
                    setCurrentTab('image-guardian');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {currentTab === 'compare' && (
                <CompareScreen
                  compareOutfitIds={compareOutfitIds}
                  onToggleOutfit={handleToggleCompare}
                  onStartRemix={(id) => {
                    setSelectedOutfitId(id);
                    setCustomization((prev) => ({ ...prev, selectedAccessoryIds: [] }));
                    setCurrentTab('customize');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {currentTab === 'lookbook' && (
                <LookbookScreen
                  looks={lookbook}
                  onDeleteLook={handleDeleteLook}
                  onStartRemix={() => handleStartRemix()}
                  onRemixLook={handleRemixLook}
                />
              )}

              {currentTab === 'image-guardian' && (
                <ImageGuardianScreen
                  initialOutfitId={selectedOutfitId}
                  onBack={() => {
                    setCurrentTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectOutfitForRemix={(id) => {
                    setSelectedOutfitId(id);
                    setCurrentTab('customize');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#161A1D]/95 text-[#F8F6F0] text-xs font-medium rounded-xl shadow-lg border border-[#DED7C6]/25 backdrop-blur-md flex items-center gap-2 whitespace-nowrap max-w-[92vw]"
          >
            <span className="w-2 h-2 rounded-full bg-[#C88E1B] shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={(tab) => {
          setCurrentTab(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        lookbookCount={lookbook.length}
        compareCount={compareOutfitIds.length}
      />
    </div>
  );
}

export default App;
