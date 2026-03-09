// @ts-nocheck
/**
 * House Building Tutorial System - Interactive & Professional Edition
 * 
 * PURPOSE: Provides an interactive, step-by-step tutorial for building houses in the 3D simulator.
 * 
 * KEY FEATURES:
 * - Step-by-step guidance with visual highlights
 * - Progress tracking with progress bar
 * - Interactive hints and arrows pointing to UI elements
 * - Automatic step advancement when conditions are met
 * - Keyboard shortcuts for navigation
 * - Visual celebrations on completion
 * - State persistence (saves progress to localStorage)
 * - Multi-language: English, Arabic (RTL), Japanese
 * 
 * HOW IT WORKS:
 * 1. Tutorial consists of multiple "steps" defined in the steps array
 * 2. Each step has a title, description, condition to check, and visual highlights
 * 3. System continuously checks if step conditions are met (every 500ms)
 * 4. When condition is met, automatically advances to next step
 * 5. User can also manually navigate with Previous/Next buttons or arrow keys
 * 6. Visual highlights guide user to parts or UI elements they need to interact with
 */

// ========== TRANSLATIONS (en, ar, ja) ==========
const TUTORIAL_TRANSLATIONS: Record<string, Record<string, string | null>> = {
  en: {
    ui_houseTutorial: 'House Tutorial',
    ui_interactiveGuide: 'Interactive Guide',
    ui_prev: '◀ Previous',
    ui_next: 'Next ▶',
    ui_finish: '🎉 Finish',
    ui_skip: 'Skip Tutorial',
    ui_tip: '💡 Tip: Use ← → arrow keys to navigate',
    step_indicator: 'Step %1 of %2',
    msg_started: '🏠 House Building Tutorial Started!',
    msg_stopped: 'Tutorial stopped',
    step0_title: "Welcome to House Building Tutorial! 🏠",
    step0_description: "This interactive tutorial will guide you step-by-step to build a house. You'll learn how to load parts, position them, and connect them together. Let's begin!",
    step0_hint: null,
    step1_title: "Step 1: Load Your First Part",
    step1_description: "Click on 'House Part 1' in the component library panel to load it into the scene. Look for the button in the left sidebar.",
    step1_hint: "Click the 'House Part 1' button in the component library",
    step2_title: "Step 2: Position the First Part",
    step2_description: "Great! The part is loaded. Now drag it with your mouse to position it on the ground. This will be the foundation of your house.",
    step2_hint: "Click and drag the part to move it around",
    step3_title: "Step 3: Load the Second Part",
    step3_description: "Excellent! Now let's add another part. Click on 'House Part 2' in the component library to load it.",
    step3_hint: "Click the 'House Part 2' button",
    step4_title: "Step 4: Connect Parts Together",
    step4_description: "Perfect! Now select 'House Part 2' by clicking on it, move it close to 'House Part 1', and press the 'C' key to connect them together. The parts will snap together when close enough.",
    step4_hint: "Select part 2, move it near part 1, then press 'C' to connect",
    step5_title: "Step 5: Continue Building",
    step5_description: "Fantastic! You've successfully connected two parts. Continue by loading more parts (part_3, part_4, etc.) and connecting them. You can connect up to 30 parts in a group.",
    step5_hint: "Keep adding and connecting parts to build your house",
    step6_title: "Step 6: Build Your Complete House",
    step6_description: "You're doing great! Keep adding parts and connecting them to build a complete house structure. Remember: Press 'C' to connect parts, and 'X' to disconnect if needed.",
    step6_hint: "Build a complete house with at least 5 parts",
    step7_title: "Tutorial Complete! 🎉",
    step7_description: "Congratulations! You've successfully learned how to build a house. You can now continue building on your own. Well done!",
    step7_hint: null,
  },
  ar: {
    ui_houseTutorial: 'تعليم بناء المنزل',
    ui_interactiveGuide: 'دليل تفاعلي',
    ui_prev: 'السابق ◀',
    ui_next: '▶ التالي',
    ui_finish: '🎉 إنهاء',
    ui_skip: 'تخطي التعلم',
    ui_tip: '💡 نصيحة: استخدم مفاتيح ← → للتنقل',
    step_indicator: 'الخطوة %1 من %2',
    msg_started: '🏠 بدأ تعليم بناء المنزل!',
    msg_stopped: 'تم إيقاف التعلم',
    step0_title: "مرحباً بك في تعليم بناء المنزل! 🏠",
    step0_description: "سيرشدك هذا التعلم التفاعلي خطوة بخطوة لبناء منزل. ستتعلم تحميل القطع ووضعها وتوصيلها معاً. لنبدأ!",
    step0_hint: null,
    step1_title: "الخطوة 1: تحميل القطعة الأولى",
    step1_description: "انقر على «قطعة المنزل 1» في لوحة مكتبة المكوّنات لتحميلها إلى المشهد. ابحث عن الزر في الشريط الجانبي الأيسر.",
    step1_hint: "انقر على زر «قطعة المنزل 1» في مكتبة المكوّنات",
    step2_title: "الخطوة 2: وضع القطعة الأولى",
    step2_description: "ممتاز! تم تحميل القطعة. اسحبها بالفأرة لوضعها على الأرض. سيكون هذا أساس منزلك.",
    step2_hint: "انقر واسحب القطعة لتحريكها",
    step3_title: "الخطوة 3: تحميل القطعة الثانية",
    step3_description: "رائع! لنضف قطعة أخرى. انقر على «قطعة المنزل 2» في مكتبة المكوّنات لتحميلها.",
    step3_hint: "انقر على زر «قطعة المنزل 2»",
    step4_title: "الخطوة 4: توصيل القطع معاً",
    step4_description: "ممتاز! اختر «قطعة المنزل 2» بالضغط عليها، وقرّبها من «قطعة المنزل 1»، ثم اضغط مفتاح 'C' لتوصيلهما. ستلتصق القطع عند التقارُب الكافي.",
    step4_hint: "اختر القطعة 2، قرّبها من القطعة 1، ثم اضغط 'C' للتوصيل",
    step5_title: "الخطوة 5: مواصلة البناء",
    step5_description: "رائع! وصلت قطعتين بنجاح. تابع تحميل المزيد (قطعة 3، 4، إلخ) وتوصيلها. يمكنك توصيل حتى 30 قطعة في مجموعة واحدة.",
    step5_hint: "تابع إضافة وتوصيل القطع لبناء منزلك",
    step6_title: "الخطوة 6: بناء المنزل الكامل",
    step6_description: "أحسنت! تابع إضافة القطع وتوصيلها لبناء هيكل منزل كامل. تذكّر: 'C' للتوصيل و'X' لفك التوصيل عند الحاجة.",
    step6_hint: "ابنِ منزلاً كاملاً من 5 قطع على الأقل",
    step7_title: "اكتمل التعلم! 🎉",
    step7_description: "تهانينا! تعلمت كيفية بناء منزل بنجاح. يمكنك الآن المواصلة وحدك. أحسنت!",
    step7_hint: null,
  },
  ja: {
    ui_houseTutorial: '家づくりチュートリアル',
    ui_interactiveGuide: 'インタラクティブガイド',
    ui_prev: '◀ 前へ',
    ui_next: '次へ ▶',
    ui_finish: '🎉 完了',
    ui_skip: 'チュートリアルをスキップ',
    ui_tip: '💡 ヒント: ← → キーで移動',
    step_indicator: 'ステップ %1 / %2',
    msg_started: '🏠 家づくりチュートリアルを開始しました！',
    msg_stopped: 'チュートリアルを停止しました',
    step0_title: "家づくりチュートリアルへようこそ！ 🏠",
    step0_description: "このインタラクティブなチュートリアルでは、家を組み立てる手順をステップごとに案内します。パーツの読み込み、配置、接続の仕方を学べます。始めましょう！",
    step0_hint: null,
    step1_title: "ステップ1: 最初のパーツを読み込む",
    step1_description: "コンポーネントライブラリの「ハウスパート1」をクリックしてシーンに読み込みましょう。左のサイドバーにボタンがあります。",
    step1_hint: "コンポーネントライブラリの「ハウスパート1」をクリック",
    step2_title: "ステップ2: 最初のパーツを配置する",
    step2_description: "パーツが読み込まれました。マウスでドラッグして地面に配置しましょう。これが家の土台になります。",
    step2_hint: "パーツをクリックしてドラッグし、移動します",
    step3_title: "ステップ3: 2番目のパーツを読み込む",
    step3_description: "次のパーツを追加します。コンポーネントライブラリの「ハウスパート2」をクリックして読み込みましょう。",
    step3_hint: "「ハウスパート2」ボタンをクリック",
    step4_title: "ステップ4: パーツを接続する",
    step4_description: "「ハウスパート2」をクリックして選択し、「ハウスパート1」に近づけてから 'C' キーで接続します。近づくとパーツがスナップします。",
    step4_hint: "パート2を選択し、パート1に近づけて 'C' で接続",
    step5_title: "ステップ5: 組み立てを続ける",
    step5_description: "2つのパーツを接続できました。パート3、4などを読み込み、接続を続けましょう。最大30パーツまで1グループで接続できます。",
    step5_hint: "パーツを追加し、接続して家を組み立てます",
    step6_title: "ステップ6: 家を完成させる",
    step6_description: "順調です！パーツを追加して接続し、家の形にしましょう。'C' で接続、'X' で接続解除です。",
    step6_hint: "少なくとも5パーツで家を完成させます",
    step7_title: "チュートリアル完了！ 🎉",
    step7_description: "おめでとうございます！家の組み立て方を習得しました。このまま自由に組み立てを続けられます。よくできました！",
    step7_hint: null,
  },
};

/**
 * HouseTutorial Class
 * 
 * Manages the entire tutorial system including UI, step progression, and visual feedback.
 */
class HouseTutorial {
    // ========== STATE VARIABLES ==========
    
    // Whether the tutorial is currently active/running
    private isActive: boolean = false;
    
    // Current step index (0-based, points to position in steps array)
    private currentStep: number = 0;
    
    // Main tutorial overlay container (the entire tutorial panel)
    private tutorialOverlay: HTMLElement | null = null;
    
    // Content area inside overlay (contains title, description, hints)
    private tutorialContent: HTMLElement | null = null;
    
    // Step indicator showing "Step X of Y" and percentage
    private stepIndicator: HTMLElement | null = null;
    
    // Progress bar container element
    private progressBar: HTMLElement | null = null;
    
    // Progress bar fill element (the green bar that grows)
    private progressFill: HTMLElement | null = null;
    
    // Skip tutorial button
    private skipButton: HTMLElement | null = null;
    
    // Next step button
    private nextButton: HTMLElement | null = null;
    
    // Previous step button
    private prevButton: HTMLElement | null = null;
    
    // Interval ID for checking step conditions (setInterval return value)
    private checkInterval: any = null;
    
    // Overlay for highlighting (not currently used but reserved for future)
    private highlightOverlay: HTMLElement | null = null;
    
    // Animated arrow pointing to UI elements (the 👇 emoji)
    private hintArrow: HTMLElement | null = null;
    
    // Reference to currently highlighted part in 3D scene
    private partHighlight: any = null;
    
    // Celebration element (🎉 emoji shown on completion)
    private celebrationElement: HTMLElement | null = null;
    
    // Keyboard event handler function (stored so we can remove it later)
    private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;

    // Current language: 'en' | 'ar' | 'ja'
    private currentLang: string = 'en';

    // Language selector element (in tutorial header)
    private langSelector: HTMLSelectElement | null = null;

    // Header text elements (for refresh on language change)
    private headerTitleEl: HTMLElement | null = null;
    private headerSubtitleEl: HTMLElement | null = null;
    private shortcutsHintEl: HTMLElement | null = null;

    // ========== TUTORIAL STEPS DEFINITION ==========
    /**
     * Steps Array
     * 
     * Defines all tutorial steps. Each step object contains:
     * - title: Step title displayed in the tutorial panel
     * - description: Detailed instructions for the user
     * - action: Type of action for this step (for reference)
     * - partName: Name of part involved (if applicable)
     * - checkCondition: Function that returns true when step is complete
     * - autoAdvance: Milliseconds to wait before auto-advancing (if set)
     * - highlightPart: Part name(s) to highlight in 3D scene (null if none)
     * - highlightUI: UI element selector to highlight (null if none)
     * - hint: Additional hint text shown in hint box
     */
    private steps = [
        {
            // Step 0: Welcome screen
            title: "Welcome to House Building Tutorial! 🏠",
            description: "This interactive tutorial will guide you step-by-step to build a house. You'll learn how to load parts, position them, and connect them together. Let's begin!",
            action: "none", // No action required
            checkCondition: () => true, // Always true, so auto-advances immediately
            autoAdvance: 2500, // Auto-advance after 2.5 seconds
            highlightPart: null, // No parts to highlight
            highlightUI: null, // No UI to highlight
            hint: null // No hint needed
        },
        {
            // Step 1: Load first part
            title: "Step 1: Load Your First Part",
            description: "Click on 'House Part 1' in the component library panel to load it into the scene. Look for the button in the left sidebar.",
            action: "load_part", // User needs to load a part
            partName: "part_1", // The part to load
            checkCondition: () => {
                // Check if part_1 has been loaded into the scene
                return this.hasPartLoaded("part_1");
            },
            highlightPart: null, // Part not loaded yet, can't highlight
            highlightUI: "part_1", // Highlight the "House Part 1" button in UI
            hint: "Click the 'House Part 1' button in the component library"
        },
        {
            // Step 2: Position the first part
            title: "Step 2: Position the First Part",
            description: "Great! The part is loaded. Now drag it with your mouse to position it on the ground. This will be the foundation of your house.",
            action: "position_part", // User needs to position the part
            partName: "part_1", // The part to position
            checkCondition: () => {
                // Check if part_1 exists and is positioned on or above ground (y >= 0)
                const part = this.findPart("part_1");
                return part && part.position.y >= 0;
            },
            highlightPart: "part_1", // Highlight the part in 3D scene
            highlightUI: null, // No UI to highlight
            hint: "Click and drag the part to move it around"
        },
        {
            // Step 3: Load second part
            title: "Step 3: Load the Second Part",
            description: "Excellent! Now let's add another part. Click on 'House Part 2' in the component library to load it.",
            action: "load_part",
            partName: "part_2",
            checkCondition: () => {
                // Check if part_2 has been loaded
                return this.hasPartLoaded("part_2");
            },
            highlightPart: null,
            highlightUI: "part_2", // Highlight the "House Part 2" button
            hint: "Click the 'House Part 2' button"
        },
        {
            // Step 4: Connect parts together
            title: "Step 4: Connect Parts Together",
            description: "Perfect! Now select 'House Part 2' by clicking on it, move it close to 'House Part 1', and press the 'C' key to connect them together. The parts will snap together when close enough.",
            action: "connect_parts", // User needs to connect parts
            checkCondition: () => {
                // Check if parts are connected
                const part1 = this.findPart("part_1");
                const part2 = this.findPart("part_2");
                if (!part1 || !part2) return false; // Both parts must exist
                
                // Check new connection system first (preferred)
                if (window.houseConnectionSystem) {
                    const conn1 = window.houseConnectionSystem.getConnectionInfo(part1);
                    const conn2 = window.houseConnectionSystem.getConnectionInfo(part2);
                    // If either part is connected, they're connected to each other
                    if (conn1 && conn1.isConnected) return true;
                    if (conn2 && conn2.isConnected) return true;
                }
                // Fallback to old system (for backwards compatibility)
                if (window.houseGroupManager) {
                    return window.houseGroupManager.isConnected(part1) || window.houseGroupManager.isConnected(part2);
                }
                return false;
            },
            highlightPart: ["part_1", "part_2"], // Highlight both parts
            highlightUI: null,
            hint: "Select part 2, move it near part 1, then press 'C' to connect"
        },
        {
            // Step 5: Continue building
            title: "Step 5: Continue Building",
            description: "Fantastic! You've successfully connected two parts. Continue by loading more parts (part_3, part_4, etc.) and connecting them. You can connect up to 30 parts in a group.",
            action: "continue_building",
            checkCondition: () => {
                // Check if at least 3 parts are loaded
                const loadedParts = this.getLoadedParts();
                return loadedParts.length >= 3;
            },
            highlightPart: null,
            highlightUI: null,
            hint: "Keep adding and connecting parts to build your house"
        },
        {
            // Step 6: Build complete house
            title: "Step 6: Build Your Complete House",
            description: "You're doing great! Keep adding parts and connecting them to build a complete house structure. Remember: Press 'C' to connect parts, and 'X' to disconnect if needed.",
            action: "complete_house",
            checkCondition: () => {
                // Check if at least 5 parts are loaded (basic house structure)
                const loadedParts = this.getLoadedParts();
                return loadedParts.length >= 5;
            },
            highlightPart: null,
            highlightUI: null,
            hint: "Build a complete house with at least 5 parts"
        },
        {
            // Step 7: Tutorial complete
            title: "Tutorial Complete! 🎉",
            description: "Congratulations! You've successfully learned how to build a house. You can now continue building on your own. Well done!",
            action: "complete",
            checkCondition: () => true, // Always true
            autoAdvance: 4000, // Auto-advance after 4 seconds
            highlightPart: null,
            highlightUI: null,
            hint: null
        }
    ];

    /**
     * Constructor
     * 
     * Initializes the tutorial system and loads saved state from localStorage.
     * This allows the tutorial to resume from where the user left off.
     */
    constructor() {
        this.loadState(); // Restore previous state if any
        this.currentLang = (localStorage.getItem('houseTutorialLang') || 'en');
        if (!TUTORIAL_TRANSLATIONS[this.currentLang]) this.currentLang = 'en';
        console.log("🏠 House Tutorial System initialized (Interactive & Professional Edition)");
    }

    /**
     * Translate a key for the current language.
     * Falls back to English if the key is missing in the current language.
     */
    private t(key: string): string | null {
        const L = TUTORIAL_TRANSLATIONS[this.currentLang] || TUTORIAL_TRANSLATIONS['en'];
        const v = L[key];
        if (v != null && v !== '') return v;
        return (TUTORIAL_TRANSLATIONS['en'] || {})[key] ?? null;
    }

    /**
     * Set tutorial language and refresh UI.
     * Saves to localStorage.
     */
    setLanguage(lang: string) {
        if (!TUTORIAL_TRANSLATIONS[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('houseTutorialLang', lang);
        this.applyRtl();
        this.updateUIStrings();
        this.showCurrentStep();
    }

    /** Apply RTL and lang to overlay when current language is Arabic. */
    private applyRtl() {
        if (!this.tutorialOverlay) return;
        if (this.currentLang === 'ar') {
            this.tutorialOverlay.setAttribute('dir', 'rtl');
            this.tutorialOverlay.setAttribute('lang', 'ar');
        } else {
            this.tutorialOverlay.removeAttribute('dir');
            this.tutorialOverlay.setAttribute('lang', this.currentLang === 'ja' ? 'ja' : 'en');
        }
    }

    /** Update static UI strings (header, buttons, tip) after language change. */
    private updateUIStrings() {
        if (this.headerTitleEl) this.headerTitleEl.textContent = this.t('ui_houseTutorial') || 'House Tutorial';
        if (this.headerSubtitleEl) this.headerSubtitleEl.textContent = this.t('ui_interactiveGuide') || 'Interactive Guide';
        if (this.prevButton) this.prevButton.textContent = this.t('ui_prev') || '◀ Previous';
        if (this.skipButton) this.skipButton.textContent = this.t('ui_skip') || 'Skip Tutorial';
        if (this.shortcutsHintEl) this.shortcutsHintEl.textContent = this.t('ui_tip') || '💡 Tip: Use ← → arrow keys to navigate';
        if (this.langSelector) this.langSelector.value = this.currentLang;
    }

    /**
     * Start the tutorial
     * 
     * PROCESS:
     * 1. Check if already active (prevent double-start)
     * 2. Set active flag and reset to step 0
     * 3. Save state to localStorage
     * 4. Create and show tutorial UI
     * 5. Setup keyboard shortcuts
     * 6. Show first step
     * 7. Start checking step conditions
     * 8. Show welcome message
     */
    start() {
        if (this.isActive) return; // Already running, don't start again
        
        this.isActive = true;
        this.currentStep = 0; // Start from beginning
        this.saveState(); // Save to localStorage
        this.createTutorialUI(); // Build the tutorial panel
        this.setupKeyboardShortcuts(); // Enable arrow key navigation
        this.showCurrentStep(); // Display first step
        this.startChecking(); // Start checking if step conditions are met
        
        // Show notification message
        if (typeof window.showMessage === 'function') {
            window.showMessage(this.t('msg_started') || "🏠 House Building Tutorial Started!", "success");
        }
        
        console.log("✅ Tutorial started");
    }

    /**
     * Stop the tutorial
     * 
     * PROCESS:
     * 1. Check if active (can't stop if not running)
     * 2. Set active flag to false
     * 3. Reset to step 0
     * 4. Save state
     * 5. Hide UI
     * 6. Remove all highlights
     * 7. Stop checking conditions
     * 8. Remove keyboard shortcuts
     * 9. Hide celebration
     * 10. Show notification
     */
    stop() {
        if (!this.isActive) return; // Not running, nothing to stop
        
        this.isActive = false;
        this.currentStep = 0;
        this.saveState();
        this.hideTutorialUI(); // Remove tutorial panel
        this.removeHighlights(); // Remove part highlights
        this.removeHintArrow(); // Remove hint arrow
        this.stopChecking(); // Stop condition checking
        this.removeKeyboardShortcuts(); // Remove keyboard listeners
        this.showCelebration(false); // Hide celebration if shown
        
        if (typeof window.showMessage === 'function') {
            window.showMessage(this.t('msg_stopped') || "Tutorial stopped");
        }
        
        console.log("⏹️ Tutorial stopped");
    }

    /**
     * Toggle tutorial on/off
     * 
     * If active, stops it. If inactive, starts it.
     * 
     * @returns Current active state (after toggle)
     */
    toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
        return this.isActive;
    }

    /**
     * Create professional tutorial UI overlay
     * 
     * Builds the entire tutorial panel with:
     * - Header with icon and title
     * - Step indicator showing progress
     * - Progress bar
     * - Content area (title, description, hints)
     * - Navigation buttons (Previous, Next, Skip)
     * - Keyboard shortcuts hint
     * 
     * The panel is positioned in the top-right corner with a modern gradient design.
     */
    private createTutorialUI() {
        // Remove existing overlay if any (prevent duplicates)
        const existing = document.getElementById('houseTutorialOverlay');
        if (existing) existing.remove();

        // Create main overlay container
        this.tutorialOverlay = document.createElement('div');
        this.tutorialOverlay.id = 'houseTutorialOverlay';
        // Style: Fixed position, top-right corner, gradient background, rounded corners, shadow
        this.tutorialOverlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-width: calc(100vw - 40px);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
            z-index: 10000;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
            animation: tutorialSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            backdrop-filter: blur(10px);
        `;

        // ========== HEADER SECTION ==========
        // Header with icon and title
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        `;
        
        // House icon with pulsing animation
        const icon = document.createElement('div');
        icon.textContent = '🏠';
        icon.style.cssText = `
            font-size: 32px;
            animation: tutorialPulse 2s ease-in-out infinite;
        `;
        header.appendChild(icon);
        
        // Header text with title and subtitle (translated)
        const headerText = document.createElement('div');
        headerText.style.flex = '1';
        this.headerTitleEl = document.createElement('div');
        this.headerTitleEl.style.cssText = 'font-size: 18px; font-weight: 700; margin-bottom: 4px;';
        this.headerTitleEl.textContent = this.t('ui_houseTutorial') || 'House Tutorial';
        this.headerSubtitleEl = document.createElement('div');
        this.headerSubtitleEl.style.cssText = 'font-size: 12px; opacity: 0.9;';
        this.headerSubtitleEl.textContent = this.t('ui_interactiveGuide') || 'Interactive Guide';
        headerText.appendChild(this.headerTitleEl);
        headerText.appendChild(this.headerSubtitleEl);
        header.appendChild(headerText);

        // Language selector (EN | العربية | 日本語)
        this.langSelector = document.createElement('select');
        this.langSelector.innerHTML = '<option value="en">EN</option><option value="ar">العربية</option><option value="ja">日本語</option>';
        this.langSelector.value = this.currentLang;
        this.langSelector.style.cssText = `
            padding: 4px 8px; font-size: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.4);
            background: rgba(255,255,255,0.15); color: white; cursor: pointer;
        `;
        this.langSelector.onchange = () => this.setLanguage(this.langSelector!.value);
        header.appendChild(this.langSelector);

        this.tutorialOverlay.appendChild(header);
        this.applyRtl();

        // ========== STEP INDICATOR ==========
        // Shows "Step X of Y" and percentage
        this.stepIndicator = document.createElement('div');
        this.stepIndicator.style.cssText = `
            font-size: 13px;
            opacity: 0.95;
            margin-bottom: 12px;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        // ========== PROGRESS BAR ==========
        // Visual progress indicator showing completion percentage
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 16px;
        `;
        
        // The fill bar that grows as progress increases
        this.progressFill = document.createElement('div');
        this.progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #4ade80, #22c55e);
            border-radius: 3px;
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            width: 0%;
            box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
        `;
        progressContainer.appendChild(this.progressFill);
        this.progressBar = progressContainer;

        // ========== CONTENT AREA ==========
        // Contains title, description, and hints
        this.tutorialContent = document.createElement('div');
        this.tutorialContent.style.cssText = `
            margin-bottom: 20px;
            min-height: 80px;
        `;

        // Step title (h3 element)
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 20px;
            font-weight: 700;
            line-height: 1.3;
        `;
        this.tutorialContent.appendChild(title);

        // Step description (paragraph)
        const description = document.createElement('p');
        description.style.cssText = `
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            opacity: 0.95;
        `;
        this.tutorialContent.appendChild(description);

        // Hint box (shown conditionally when step has a hint)
        const hintBox = document.createElement('div');
        hintBox.id = 'tutorialHintBox';
        hintBox.style.cssText = `
            margin-top: 12px;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.15);
            border-inline-start: 3px solid #4ade80;
            border-radius: 6px;
            font-size: 13px;
            display: none;
            font-style: italic;
        `;
        this.tutorialContent.appendChild(hintBox);

        // ========== BUTTONS SECTION ==========
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 20px;
        `;

        // Previous button (goes to previous step)
        this.prevButton = document.createElement('button');
        this.prevButton.textContent = this.t('ui_prev') || '◀ Previous';
        this.prevButton.style.cssText = `
            flex: 1;
            padding: 10px 16px;
            background: rgba(255, 255, 255, 0.15);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        // Hover effects
        this.prevButton.onmouseover = () => {
            if (!this.prevButton.disabled) {
                this.prevButton.style.background = 'rgba(255, 255, 255, 0.25)';
                this.prevButton.style.transform = 'translateY(-1px)';
            }
        };
        this.prevButton.onmouseout = () => {
            this.prevButton.style.background = 'rgba(255, 255, 255, 0.15)';
            this.prevButton.style.transform = 'translateY(0)';
        };
        this.prevButton.onclick = () => this.previousStep();
        buttonsContainer.appendChild(this.prevButton);

        // Next button (goes to next step)
        this.nextButton = document.createElement('button');
        this.nextButton.textContent = this.t('ui_next') || 'Next ▶';
        this.nextButton.style.cssText = `
            flex: 1;
            padding: 10px 16px;
            background: rgba(255, 255, 255, 0.95);
            border: none;
            border-radius: 8px;
            color: #667eea;
            cursor: pointer;
            font-size: 14px;
            font-weight: 700;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        // Hover effects
        this.nextButton.onmouseover = () => {
            this.nextButton.style.background = 'white';
            this.nextButton.style.transform = 'translateY(-2px)';
            this.nextButton.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        };
        this.nextButton.onmouseout = () => {
            this.nextButton.style.background = 'rgba(255, 255, 255, 0.95)';
            this.nextButton.style.transform = 'translateY(0)';
            this.nextButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        };
        this.nextButton.onclick = () => this.nextStep();
        buttonsContainer.appendChild(this.nextButton);

        // Skip button (stops tutorial)
        this.skipButton = document.createElement('button');
        this.skipButton.textContent = this.t('ui_skip') || 'Skip Tutorial';
        this.skipButton.style.cssText = `
            width: 100%;
            margin-top: 10px;
            padding: 8px 12px;
            background: transparent;
            border: 2px solid rgba(255, 255, 255, 0.4);
            border-radius: 8px;
            color: white;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
        `;
        // Hover effects
        this.skipButton.onmouseover = () => {
            this.skipButton.style.background = 'rgba(255, 255, 255, 0.1)';
            this.skipButton.style.borderColor = 'rgba(255, 255, 255, 0.6)';
        };
        this.skipButton.onmouseout = () => {
            this.skipButton.style.background = 'transparent';
            this.skipButton.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        };
        this.skipButton.onclick = () => this.stop();
        buttonsContainer.appendChild(this.skipButton);

        // Keyboard shortcuts hint
        this.shortcutsHintEl = document.createElement('div');
        this.shortcutsHintEl.style.cssText = `
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 11px;
            opacity: 0.8;
            text-align: center;
        `;
        this.shortcutsHintEl.textContent = this.t('ui_tip') || '💡 Tip: Use ← → arrow keys to navigate';
        buttonsContainer.appendChild(this.shortcutsHintEl);

        // ========== ASSEMBLE OVERLAY ==========
        // Add all components to the overlay in order
        this.tutorialOverlay.appendChild(this.stepIndicator);
        this.tutorialOverlay.appendChild(this.progressBar);
        this.tutorialOverlay.appendChild(this.tutorialContent);
        this.tutorialOverlay.appendChild(buttonsContainer);

        // Add overlay to document body
        document.body.appendChild(this.tutorialOverlay);

        // Add CSS animations (keyframes for slide-in, pulse, etc.)
        this.addTutorialStyles();
    }

    /**
     * Add tutorial CSS styles and animations
     * 
     * Injects CSS keyframe animations into the document head.
     * These animations are used for:
     * - Slide-in effect when tutorial appears
     * - Pulsing icon animation
     * - Highlight glow effect
     * - Bouncing arrow animation
     * - Celebration animation
     */
    private addTutorialStyles() {
        // Only add styles once (check if already exists)
        if (document.getElementById('tutorialStyles')) return;

        const style = document.createElement('style');
        style.id = 'tutorialStyles';
        style.textContent = `
            /* Slide-in animation: tutorial panel slides in from right */
            @keyframes tutorialSlideIn {
                from {
                    transform: translateX(450px) scale(0.9);
                    opacity: 0;
                }
                to {
                    transform: translateX(0) scale(1);
                    opacity: 1;
                }
            }
            
            /* Pulse animation: icon gently scales up and down */
            @keyframes tutorialPulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.1);
                }
            }
            
            /* Highlight animation: glowing border effect */
            @keyframes tutorialHighlight {
                0%, 100% {
                    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
                }
                50% {
                    box-shadow: 0 0 0 8px rgba(74, 222, 128, 0);
                }
            }
            
            /* Bounce animation: arrow bounces up and down */
            @keyframes tutorialBounce {
                0%, 100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-10px);
                }
            }
            
            /* Celebration animation: emoji spins and scales */
            @keyframes tutorialCelebration {
                0% {
                    transform: scale(0) rotate(0deg);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.2) rotate(180deg);
                    opacity: 1;
                }
                100% {
                    transform: scale(1) rotate(360deg);
                    opacity: 1;
                }
            }
            
            /* Class for highlighting UI elements */
            .tutorial-highlight-ui {
                position: relative;
                animation: tutorialHighlight 2s ease-in-out infinite !important;
                z-index: 9999 !important;
                border: 3px solid #4ade80 !important;
                border-radius: 8px !important;
                box-shadow: 0 0 20px rgba(74, 222, 128, 0.6) !important;
            }
            
            /* Class for hint arrow */
            .tutorial-hint-arrow {
                position: fixed;
                z-index: 10001;
                pointer-events: none;
                animation: tutorialBounce 1s ease-in-out infinite;
            }
            
            /* Class for celebration element */
            .tutorial-celebration {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10002;
                font-size: 80px;
                pointer-events: none;
                animation: tutorialCelebration 1s ease-out;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Hide tutorial UI
     * 
     * Animates the tutorial panel sliding out, then removes it from DOM.
     * Uses reverse animation for smooth exit.
     */
    private hideTutorialUI() {
        if (this.tutorialOverlay) {
            // Play slide-out animation (reverse of slide-in)
            this.tutorialOverlay.style.animation = 'tutorialSlideIn 0.3s ease reverse';
            // Remove from DOM after animation completes
            setTimeout(() => {
                if (this.tutorialOverlay && this.tutorialOverlay.parentNode) {
                    this.tutorialOverlay.remove();
                }
            }, 300);
        }
    }

    /**
     * Show current step with all enhancements
     * 
     * Updates the tutorial panel to display the current step:
     * - Updates title and description
     * - Updates step indicator and progress bar
     * - Shows/hides hints
     * - Updates visual highlights (parts and UI elements)
     * - Updates button states
     * - Handles auto-advance if configured
     * - Shows celebration if on completion step
     */
    private showCurrentStep() {
        // Safety check: ensure tutorial is active and step is valid
        if (!this.isActive || this.currentStep < 0 || this.currentStep >= this.steps.length) {
            return;
        }

        // Get current step definition
        const step = this.steps[this.currentStep];
        
        // Get DOM elements for content
        const title = this.tutorialContent?.querySelector('h3');
        const description = this.tutorialContent?.querySelector('p');
        const hintBox = document.getElementById('tutorialHintBox');

        // ========== UPDATE CONTENT ==========
        const stepTitle = this.t('step' + this.currentStep + '_title') || step.title;
        const stepDesc = this.t('step' + this.currentStep + '_description') || step.description;
        if (title) {
            title.textContent = stepTitle;
            title.style.animation = 'none';
            setTimeout(() => {
                if (title) title.style.animation = 'tutorialPulse 0.5s ease';
            }, 10);
        }
        if (description) {
            description.textContent = stepDesc;
        }
        
        // ========== UPDATE STEP INDICATOR ==========
        const stepTpl = this.t('step_indicator') || 'Step %1 of %2';
        const stepStr = (stepTpl.replace('%1', String(this.currentStep + 1)).replace('%2', String(this.steps.length)));
        if (this.stepIndicator) {
            this.stepIndicator.innerHTML = `
                <span>${stepStr}</span>
                <span style="opacity: 0.8;">${Math.round(((this.currentStep + 1) / this.steps.length) * 100)}%</span>
            `;
        }

        // ========== UPDATE PROGRESS BAR ==========
        // Calculate progress percentage and update fill width
        if (this.progressFill) {
            const progress = ((this.currentStep + 1) / this.steps.length) * 100;
            this.progressFill.style.width = progress + '%';
        }

        // ========== UPDATE HINTS ==========
        const stepHint = this.t('step' + this.currentStep + '_hint') || step.hint;
        if (hintBox) {
            if (stepHint) {
                hintBox.textContent = `💡 ${stepHint}`;
                hintBox.style.display = 'block';
            } else {
                hintBox.style.display = 'none';
            }
        }

        // ========== UPDATE HIGHLIGHTS ==========
        // Highlight parts in 3D scene and/or UI elements
        this.updateHighlights(step);

        // ========== UPDATE BUTTON STATES ==========
        // Previous button: disabled on first step
        if (this.prevButton) {
            this.prevButton.disabled = this.currentStep === 0;
            this.prevButton.style.opacity = this.currentStep === 0 ? '0.5' : '1';
            this.prevButton.style.cursor = this.currentStep === 0 ? 'not-allowed' : 'pointer';
        }

        // Next button: changes to "Finish" on last step
        if (this.nextButton) {
            const isLastStep = this.currentStep === this.steps.length - 1;
            this.nextButton.textContent = isLastStep ? (this.t('ui_finish') || '🎉 Finish') : (this.t('ui_next') || 'Next ▶');
        }

        // ========== AUTO-ADVANCE ==========
        // If step has autoAdvance set, automatically go to next step after delay
        if (step.autoAdvance) {
            setTimeout(() => {
                // Double-check tutorial is still active and on same step (prevent race conditions)
                if (this.isActive && this.currentStep === this.steps.indexOf(step)) {
                    this.nextStep();
                }
            }, step.autoAdvance);
        }

        // ========== CELEBRATION ==========
        // Show celebration animation on completion step
        if (step.action === 'complete') {
            this.showCelebration(true);
        }
    }

    /**
     * Update visual highlights for current step
     * 
     * Removes old highlights and applies new ones based on step configuration.
     * Highlights can be:
     * - Parts in 3D scene (green glowing effect)
     * - UI elements (buttons, etc. with animated border)
     * 
     * @param step The current step object
     */
    private updateHighlights(step: any) {
        // Remove existing highlights first
        this.removeHighlights();
        this.removeHintArrow();

        // Highlight parts in 3D scene
        if (step.highlightPart) {
            // Support both single part name and array of part names
            const partsToHighlight = Array.isArray(step.highlightPart) ? step.highlightPart : [step.highlightPart];
            partsToHighlight.forEach(partName => {
                const part = this.findPart(partName);
                if (part) {
                    this.highlightPartInScene(part);
                }
            });
        }

        // Highlight UI elements (buttons, etc.)
        if (step.highlightUI) {
            this.highlightUIElement(step.highlightUI);
        }
    }

    /**
     * Highlight a part in the 3D scene
     * 
     * Applies a green glowing effect to the part's meshes.
     * Uses emissive color and intensity to create the glow.
     * Also adds a pulsing animation for visibility.
     * 
     * @param part The part to highlight (BABYLON TransformNode)
     */
    private highlightPartInScene(part: any) {
        if (!part || !window.scene) return;

        try {
            const meshes = part.getChildMeshes();
            meshes.forEach((mesh: any) => {
                if (mesh.material) {
                    // Store original emissive color so we can restore it later
                    const originalEmissive = mesh.material.emissiveColor ? mesh.material.emissiveColor.clone() : new BABYLON.Color3(0, 0, 0);
                    
                    // Apply green highlight color
                    mesh.material.emissiveColor = new BABYLON.Color3(0.3, 0.8, 0.3); // Green
                    mesh.material.emissiveIntensity = 0.5;
                    
                    // Store original for restoration
                    if (!mesh.material._tutorialOriginalEmissive) {
                        mesh.material._tutorialOriginalEmissive = originalEmissive;
                    }

                    // Add pulsing animation: intensity oscillates between 0.3 and 0.5
                    const highlightInterval = setInterval(() => {
                        if (!this.isActive || !mesh.material) {
                            clearInterval(highlightInterval);
                            return;
                        }
                        // Use sine wave for smooth pulsing
                        const intensity = 0.3 + Math.sin(Date.now() / 300) * 0.2;
                        mesh.material.emissiveIntensity = intensity;
                    }, 50); // Update every 50ms for smooth animation

                    // Store interval ID for cleanup
                    if (!mesh._tutorialHighlightInterval) {
                        mesh._tutorialHighlightInterval = highlightInterval;
                    }
                }
            });
            this.partHighlight = part; // Store reference for cleanup
        } catch (e) {
            console.warn('Could not highlight part:', e);
        }
    }

    /**
     * Highlight a UI element
     * 
     * Finds and highlights a UI element (usually a button) by:
     * - Adding a CSS class with animated border
     * - Creating a hint arrow pointing to it
     * - Scrolling it into view if needed
     * 
     * @param selector String to identify the element (ID, text content, or data attribute)
     */
    private highlightUIElement(selector: string) {
        let element: HTMLElement | null = null;
        
        // Try to find element by ID first
        if (selector.startsWith('#')) {
            element = document.querySelector(selector) as HTMLElement;
        } else {
            // Try to find button by text content, ID, or data attribute
            const buttons = Array.from(document.querySelectorAll('button'));
            element = buttons.find(btn => 
                btn.textContent?.toLowerCase().includes(selector.toLowerCase()) ||
                btn.id?.includes(selector) ||
                btn.getAttribute('data-part') === selector
            ) as HTMLElement || null;
        }

        if (element) {
            // Add highlight class (animated border)
            element.classList.add('tutorial-highlight-ui');
            
            // Scroll element into view (centered) if it's off-screen
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Create animated arrow pointing to the element
            this.createHintArrow(element);
        } else {
            console.log(`Could not find UI element: ${selector}`);
        }
    }

    /**
     * Create animated hint arrow pointing to element
     * 
     * Creates a bouncing 👇 emoji that points to a UI element.
     * The arrow position updates when window scrolls or resizes.
     * 
     * @param targetElement The element to point to
     */
    private createHintArrow(targetElement: HTMLElement) {
        // Remove existing arrow first
        this.removeHintArrow();

        // Create arrow element
        const arrow = document.createElement('div');
        arrow.className = 'tutorial-hint-arrow';
        arrow.innerHTML = '👇'; // Pointing down emoji
        arrow.style.cssText = `
            position: fixed;
            font-size: 40px;
            z-index: 10001;
            pointer-events: none;
            animation: tutorialBounce 1s ease-in-out infinite;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        `;

        // Function to update arrow position (centered above target element)
        const updatePosition = () => {
            const rect = targetElement.getBoundingClientRect();
            arrow.style.left = (rect.left + rect.width / 2 - 20) + 'px'; // Center horizontally
            arrow.style.top = (rect.top - 50) + 'px'; // 50px above element
        };

        // Initial position
        updatePosition();
        
        // Update position when window scrolls or resizes
        window.addEventListener('scroll', updatePosition);
        window.addEventListener('resize', updatePosition);
        
        // Add to document
        document.body.appendChild(arrow);
        this.hintArrow = arrow; // Store reference for cleanup
    }

    /**
     * Remove all highlights
     * 
     * Cleans up all visual highlights:
     * - Restores part materials to original state
     * - Stops pulsing animations
     * - Removes UI element highlight classes
     */
    private removeHighlights() {
        // Remove part highlights in 3D scene
        if (this.partHighlight) {
            try {
                const meshes = this.partHighlight.getChildMeshes();
                meshes.forEach((mesh: any) => {
                    if (mesh.material && mesh.material._tutorialOriginalEmissive) {
                        // Restore original emissive color
                        mesh.material.emissiveColor = mesh.material._tutorialOriginalEmissive;
                        mesh.material.emissiveIntensity = 0;
                        delete mesh.material._tutorialOriginalEmissive;
                    }
                    // Stop pulsing animation
                    if (mesh._tutorialHighlightInterval) {
                        clearInterval(mesh._tutorialHighlightInterval);
                        delete mesh._tutorialHighlightInterval;
                    }
                });
            } catch (e) {
                console.warn('Error removing part highlight:', e);
            }
            this.partHighlight = null;
        }

        // Remove UI element highlights
        document.querySelectorAll('.tutorial-highlight-ui').forEach(el => {
            el.classList.remove('tutorial-highlight-ui');
        });
    }

    /**
     * Remove hint arrow
     * 
     * Removes the animated arrow pointing to UI elements.
     */
    private removeHintArrow() {
        if (this.hintArrow && this.hintArrow.parentNode) {
            this.hintArrow.remove();
            this.hintArrow = null;
        }
    }

    /**
     * Show celebration animation
     * 
     * Displays a large 🎉 emoji in the center of the screen with a spin animation.
     * Used when tutorial is completed.
     * 
     * @param show true to show celebration, false to hide
     */
    private showCelebration(show: boolean) {
        if (show && !this.celebrationElement) {
            // Create celebration element
            const celebration = document.createElement('div');
            celebration.className = 'tutorial-celebration';
            celebration.innerHTML = '🎉';
            celebration.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10002;
                font-size: 120px;
                pointer-events: none;
                animation: tutorialCelebration 1.5s ease-out;
                filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
            `;
            document.body.appendChild(celebration);
            this.celebrationElement = celebration;

            // Remove after animation completes (2 seconds)
            setTimeout(() => {
                if (this.celebrationElement && this.celebrationElement.parentNode) {
                    this.celebrationElement.remove();
                    this.celebrationElement = null;
                }
            }, 2000);
        } else if (!show && this.celebrationElement) {
            // Hide celebration if requested
            if (this.celebrationElement.parentNode) {
                this.celebrationElement.remove();
            }
            this.celebrationElement = null;
        }
    }

    /**
     * Setup keyboard shortcuts
     * 
     * Enables keyboard navigation:
     * - Arrow Right: Next step
     * - Arrow Left: Previous step
     * - Escape: Stop tutorial
     * 
     * The handler is stored so it can be removed later.
     */
    private setupKeyboardShortcuts() {
        this.keyboardHandler = (e: KeyboardEvent) => {
            if (!this.isActive) return; // Ignore if tutorial not active
            
            // Prevent default only for our shortcuts (prevents page scrolling)
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }

            // Handle shortcuts (only if no modifier keys pressed)
            if (e.key === 'ArrowRight' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                this.nextStep();
            } else if (e.key === 'ArrowLeft' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                this.previousStep();
            } else if (e.key === 'Escape' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                this.stop();
            }
        };

        // Add event listener
        window.addEventListener('keydown', this.keyboardHandler);
    }

    /**
     * Remove keyboard shortcuts
     * 
     * Removes the keyboard event listener to prevent memory leaks.
     */
    private removeKeyboardShortcuts() {
        if (this.keyboardHandler) {
            window.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
    }

    /**
     * Go to next step
     * 
     * Advances to the next step in the tutorial.
     * If on last step, shows celebration and stops tutorial after 3 seconds.
     */
    private nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            // Not on last step: advance
            this.currentStep++;
            this.saveState(); // Save progress
            this.showCurrentStep(); // Update UI
            
            // Play success sound effect (placeholder for future enhancement)
            this.playSound('success');
        } else {
            // On last step: show celebration and stop
            this.showCelebration(true);
            setTimeout(() => {
                this.stop();
            }, 3000); // Stop after 3 seconds
        }
    }

    /**
     * Go to previous step
     * 
     * Goes back to the previous step in the tutorial.
     * Does nothing if already on first step.
     */
    private previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.saveState(); // Save progress
            this.showCurrentStep(); // Update UI
        }
    }

    /**
     * Play sound effect (optional enhancement)
     * 
     * Placeholder for sound effects. Can be enhanced to play actual audio files.
     * 
     * @param type Type of sound ('success', 'error', or 'click')
     */
    private playSound(type: 'success' | 'error' | 'click') {
        // Optional: Add sound effects using Web Audio API or HTML5 Audio
        // This is a placeholder for future enhancement
        try {
            // You can add actual sound files here if desired
            console.log(`🔊 Playing ${type} sound`);
        } catch (e) {
            // Silently fail if audio is not available
        }
    }

    /**
     * Start checking step conditions
     * 
     * Sets up an interval that checks every 500ms if the current step's condition is met.
     * When condition is met, automatically advances to next step after a 1.5 second delay.
     * 
     * This allows the tutorial to progress automatically as the user completes tasks.
     */
    private startChecking() {
        if (this.checkInterval) return; // Already checking
        
        // Check every 500ms
        this.checkInterval = setInterval(() => {
            if (!this.isActive) {
                // Tutorial stopped, stop checking
                this.stopChecking();
                return;
            }

            // Get current step
            const step = this.steps[this.currentStep];
            
            // Check if step condition is met
            if (step && step.checkCondition && step.checkCondition()) {
                // Condition met! Auto-advance after a short delay
                setTimeout(() => {
                    // Double-check tutorial is still active and on same step
                    if (this.isActive && this.currentStep === this.steps.indexOf(step)) {
                        this.nextStep();
                    }
                }, 1500); // Wait 1.5 seconds before advancing
            }
        }, 500); // Check every 500ms
    }

    /**
     * Stop checking step conditions
     * 
     * Clears the interval that checks step conditions.
     * Called when tutorial stops.
     */
    private stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // ========== HELPER METHODS ==========

    /**
     * Check if a part is loaded
     * 
     * @param partName Name of the part to check (e.g., "part_1")
     * @returns true if part exists in scene, false otherwise
     */
    private hasPartLoaded(partName: string): boolean {
        return this.findPart(partName) !== null;
    }

    /**
     * Find a part by name
     * 
     * Searches through window.allParts array to find a part with matching baseName.
     * 
     * @param partName Name of the part to find (e.g., "part_1")
     * @returns The part object if found, null otherwise
     */
    private findPart(partName: string): any {
        if (!window.allParts || !Array.isArray(window.allParts)) {
            return null;
        }
        return window.allParts.find(part => {
            return part.metadata && 
                   part.metadata.baseName === partName;
        }) || null;
    }

    /**
     * Get all loaded house parts
     * 
     * Filters window.allParts to return only house parts (baseName starts with 'part_').
     * 
     * @returns Array of all house part objects
     */
    private getLoadedParts(): any[] {
        if (!window.allParts || !Array.isArray(window.allParts)) {
            return [];
        }
        return window.allParts.filter(part => {
            return part.metadata && 
                   part.metadata.baseName && 
                   part.metadata.baseName.startsWith('part_');
        });
    }

    /**
     * Save tutorial state to localStorage
     * 
     * Persists tutorial state so it can be restored on page reload.
     * Saves:
     * - Whether tutorial is active
     * - Current step number
     */
    private saveState() {
        localStorage.setItem('houseTutorialActive', String(this.isActive));
        localStorage.setItem('houseTutorialStep', String(this.currentStep));
    }

    /**
     * Load tutorial state from localStorage
     * 
     * Restores tutorial state from previous session.
     * Called in constructor to resume tutorial if it was active.
     */
    private loadState() {
        const savedActive = localStorage.getItem('houseTutorialActive');
        const savedStep = localStorage.getItem('houseTutorialStep');
        
        if (savedActive === 'true') {
            // Tutorial was active, restore state
            this.isActive = true;
            this.currentStep = parseInt(savedStep || '0', 10);
        }
    }

    /**
     * Get current active state
     * 
     * Public method to check if tutorial is currently active.
     * 
     * @returns true if tutorial is active, false otherwise
     */
    isTutorialActive(): boolean {
        return this.isActive;
    }
}

// ========== GLOBAL INSTANCE ==========

// Create global instance (singleton pattern)
let houseTutorial: HouseTutorial | null = null;

/**
 * Initialize tutorial system
 * 
 * Creates a new HouseTutorial instance if one doesn't exist.
 * Makes it available globally via window.houseTutorial.
 * 
 * @returns The HouseTutorial instance
 */
export function initHouseTutorial() {
    if (!houseTutorial) {
        houseTutorial = new HouseTutorial();
        window.houseTutorial = houseTutorial; // Make globally accessible
    }
    return houseTutorial;
}

/**
 * Toggle tutorial on/off
 * 
 * Convenience function to start or stop the tutorial.
 * Creates instance if it doesn't exist.
 * 
 * @returns Current active state (after toggle)
 */
export function toggleHouseTutorial(): boolean {
    if (!houseTutorial) {
        houseTutorial = initHouseTutorial();
    }
    return houseTutorial.toggle();
}

// ========== AUTO-INITIALIZATION ==========

// Auto-initialize when script loads (if window is available)
// Makes functions globally accessible for use in HTML/other scripts
if (typeof window !== 'undefined') {
    window.initHouseTutorial = initHouseTutorial;
    window.toggleHouseTutorial = toggleHouseTutorial;
}
