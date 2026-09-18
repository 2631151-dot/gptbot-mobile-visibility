'use client';

import { type CSSProperties, type FormEvent, type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Home,
  Info,
  LogOut,
  Link2,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

type Screen =
  | 'landing'
  | 'goal'
  | 'analysis-loading'
  | 'analysis'
  | 'competition'
  | 'plan'
  | 'payment'
  | 'complete'
  | 'home'
  | 'info-form'
  | 'history'
  | 'report'
  | 'competition-review'
  | 'more'
  | 'login'
  | 'signup'
  | 'password-reset'
  | 'my-info'
  | 'inquiry'
  | 'inquiry-list'
  | 'inquiry-detail'
  | 'registered-questions'
  | 'privacy-terms'
  | 'faq';

type OrderDraft = {
  question: string;
  answer: string;
};

type BusinessInfo = {
  businessName: string;
  category: string;
  location: string;
  services: string;
  strength: string;
};

type BusinessInfoKey = keyof BusinessInfo;
type InquiryId = 'documents' | 'payment';
type LanguageOption = { code: string; flag: string; name: string };
type Testimonial = { id: string; image: string; name: string; category: string; copy: string };

const orderSteps = ['목표 입력', '분석 결과', '경쟁사 비교', '진행 계획'];
const processSteps = [
  ['현황 분석', '내 업체의 GPT 답변 노출 상태를 분석합니다.'],
  ['정보 보강', '부족한 정보를 채워 더 잘 이해하도록 만듭니다.'],
  ['노출 테스트', '실제 GPT 답변에서 어떻게 보이는지 반복 테스트합니다.'],
  ['결과 기록', '모든 과정을 투명하게 기록하고 보고합니다.'],
];
const analysisInsights = ['이제 검색이 아닌 GPT에 물어요', '경쟁 업체보다 먼저 준비하세요', '웹 정보를 GPT에 맞게 정리하세요'];
const productName = 'GPT 최적화';
const testLogin = { email: 'test@gptbot.kr', password: 'gptbot1234!' };
const savedLoginIdKey = 'gptbot-saved-login-id';
const autoLoginKey = 'gptbot-auto-login';
const languageOptions: LanguageOption[] = [
  { code: 'ko', flag: '🇰🇷', name: '대한민국' },
  { code: 'en', flag: '🇺🇸', name: '미국' },
  { code: 'ja', flag: '🇯🇵', name: '일본' },
  { code: 'zh', flag: '🇨🇳', name: '중국' },
  { code: 'es', flag: '🇪🇸', name: '스페인' },
  { code: 'fr', flag: '🇫🇷', name: '프랑스' },
  { code: 'de', flag: '🇩🇪', name: '독일' },
];
const LanguageContext = createContext<{ language: LanguageOption; onChange: (language: LanguageOption) => void }>({ language: languageOptions[0], onChange: () => undefined });
const initialDraft: OrderDraft = {
  question: '잠실에 데이트 장소를 추천해줘',
  answer: '나의 업체 이름',
};
const initialBusinessInfo: BusinessInfo = {
  businessName: '',
  category: '',
  location: '',
  services: '',
  strength: '',
};
const businessInfoFields: Array<{ key: BusinessInfoKey; label: string; placeholder: string }> = [
  { key: 'businessName', label: '업체명이 무엇입니까?', placeholder: '예: 쁘띠헤어' },
  { key: 'category', label: '업종은 무엇입니까?', placeholder: '예: 미용실' },
  { key: 'location', label: '업체 위치는 어디인가요?', placeholder: '예: 서울시 송파구 잠실동' },
  { key: 'services', label: '제공하는 서비스는 무엇입니까?', placeholder: '예: 염색, 커트, 펌' },
  { key: 'strength', label: '고객에게 알리고 싶은 강점은 무엇입니까?', placeholder: '예: 1:1 맞춤 상담과 예약제 운영' },
];
const homeActivityMessages = [
  '등록 문서의 반영 상태를 확인하고 있어요.',
  'GPT 답변에 필요한 정보를 정리하고 있어요.',
  '인용 가능 문서를 점검하고 있어요.',
  '업체 정보의 누락 항목을 확인하고 있어요.',
  '다음 확인 일정을 준비하고 있어요.',
] as const;
const testimonials: Testimonial[] = [
  { id: 'hair', image: 'hair', name: '쁘띠헤어', category: '강남 · 미용실', copy: '검색만 기다리는 게 아니라\n이제는 GPT에서도 우리 매장이\n추천돼서 새로운 고객이 늘었어요.' },
  { id: 'food', image: 'food', name: '골목집 돼지갈비', category: '홍대 · 음식점', copy: '보고서를 보면서 어떤 작업이\n진행되는지 다 확인할 수 있어서\n믿음이 가요.' },
  { id: 'cafe', image: 'review-cafe', name: '온유커피', category: '성수 · 카페', copy: '우리 카페만의 분위기와 메뉴가\nGPT 답변에 자연스럽게 담겨\n예약 문의가 늘었어요.' },
  { id: 'pilates', image: 'review-pilates', name: '밸런스필라테스', category: '잠실 · 필라테스', copy: '수업 방식과 위치를 알려주니\n나에게 맞는 곳을 찾던 분들이\n먼저 연락해요.' },
  { id: 'realty', image: 'review-realty', name: '도담부동산', category: '마포 · 부동산', copy: '지역 전문성과 매물 정보를\n알기 쉽게 보여주니\n상담 연결이 빨라졌어요.' },
  { id: 'auto', image: 'review-auto', name: '클린랩 카케어', category: '송파 · 자동차 관리', copy: '서비스와 예약 방법을 정리한 뒤\nGPT에서 먼저 찾아주는\n매장이 되었어요.' },
  { id: 'academy', image: 'review-academy', name: '메이트영어학원', category: '목동 · 교육', copy: '수업 대상과 강점을 전하니\n학부모 문의가 더 정확하게\n이어지고 있어요.' },
  { id: 'pet', image: 'review-pet', name: '몽글펫살롱', category: '연남 · 반려동물 미용', copy: '서비스와 예약 정보를 정리하니\n우리 아이에게 맞는 곳을 찾는\n보호자 문의가 늘었어요.' },
];
const testimonialSlides = Array.from({ length: Math.ceil(testimonials.length / 2) }, (_, index) => testimonials.slice(index * 2, index * 2 + 2));
const managementNavScreens: Screen[] = ['home', 'more', 'history', 'report', 'registered-questions', 'my-info', 'inquiry', 'inquiry-list', 'inquiry-detail', 'privacy-terms', 'faq'];
const moreNavigationScreens: Screen[] = ['more', 'registered-questions', 'my-info', 'inquiry', 'inquiry-list', 'inquiry-detail', 'privacy-terms', 'faq'];

function HomeActivityTicker({ visible, message, typedLength }: { visible: boolean; message: string; typedLength: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <aside className={`home-activity-ticker ${visible ? 'is-visible' : ''}`} aria-hidden={!visible} aria-label="자동 작업 안내">
      <Sparkles aria-hidden="true" />
      <p className="home-activity-ticker__copy">{visible ? message.slice(0, typedLength) : ''}</p>
    </aside>,
    document.body,
  );
}

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageOption>(languageOptions[0]);
  const [draft, setDraft] = useState<OrderDraft>(initialDraft);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(initialBusinessInfo);
  const [selectedCompetitor, setSelectedCompetitor] = useState('나 · 쁘띠헤어');
  const [copied, setCopied] = useState(false);
  const [orderOrigin, setOrderOrigin] = useState<'landing' | 'home' | 'history' | 'report' | 'registered-questions'>('landing');
  const [competitionReviewOrigin, setCompetitionReviewOrigin] = useState<'report'>('report');
  const [paymentOrigin, setPaymentOrigin] = useState<'plan' | 'registered-questions'>('plan');
  const [completionOrigin, setCompletionOrigin] = useState<Screen>('home');
  const [activeInquiryId, setActiveInquiryId] = useState<InquiryId>('payment');
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'back'>('forward');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaymentConfirming, setIsPaymentConfirming] = useState(false);
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
  const [receiptSheetOpen, setReceiptSheetOpen] = useState(false);
  const [receiptMethod, setReceiptMethod] = useState<'business' | 'phone'>('business');
  const [receiptValue, setReceiptValue] = useState('');
  const [receiptIssued, setReceiptIssued] = useState(false);
  const [utilityOrigin, setUtilityOrigin] = useState<'login' | 'signup' | 'home' | 'more'>('home');
  const [activityIndex, setActivityIndex] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(false);
  const [typedLength, setTypedLength] = useState(0);
  const isSignedInManagementScreen = (['home', 'more', 'info-form', 'history', 'report', 'my-info', 'inquiry', 'inquiry-list', 'inquiry-detail', 'registered-questions', 'privacy-terms', 'faq'] as Screen[]).includes(screen);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);

  useEffect(() => {
    document.documentElement.lang = language.code;
  }, [language]);

  useEffect(() => {
    if (window.localStorage.getItem(autoLoginKey) === 'true') {
      setScreen('home');
    }
  }, []);

  useEffect(() => {
    if (!isSignedInManagementScreen) {
      setTickerVisible(false);
      setTypedLength(0);
      return;
    }
    let showTimer = 0;
    let hideTimer = 0;
    const showActivity = () => {
      setActivityIndex(Math.floor(Math.random() * homeActivityMessages.length));
      setTickerVisible(true);
      hideTimer = window.setTimeout(() => setTickerVisible(false), 2000);
      showTimer = window.setTimeout(showActivity, 30000);
    };
    showTimer = window.setTimeout(showActivity, 4200);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [isSignedInManagementScreen]);

  const activityMessage = homeActivityMessages[activityIndex];

  useEffect(() => {
    if (!tickerVisible) {
      setTypedLength(0);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedLength(activityMessage.length);
      return;
    }
    setTypedLength(0);
    let length = 0;
    const typeTimer = window.setInterval(() => {
      length += 1;
      setTypedLength(length);
      if (length >= activityMessage.length) window.clearInterval(typeTimer);
    }, 28);
    return () => window.clearInterval(typeTimer);
  }, [activityMessage, tickerVisible]);

  const navigate = (next: Screen, direction: 'forward' | 'back' = 'forward', showLoader = true) => {
    if (next === screen || isTransitioning) return;
    setMenuOpen(false);
    setTransitionDirection(direction);
    if (!showLoader) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setScreen(next);
      return;
    }
    setIsTransitioning(true);
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setScreen(next);
      setIsTransitioning(false);
    }, 520);
  };

  const startAnalysis = () => {
    navigate('analysis-loading');
  };

  const beginOrder = (origin: 'landing' | 'home' | 'history' | 'report' | 'registered-questions') => {
    setOrderOrigin(origin);
    navigate('goal');
  };

  const openCompetitionReview = (origin: 'report') => {
    setCompetitionReviewOrigin(origin);
    navigate('competition-review');
  };

  const closeCompetitionReview = () => navigate(competitionReviewOrigin, 'back');

  const openPayment = (origin: 'plan' | 'registered-questions') => {
    setPaymentOrigin(origin);
    navigate('payment');
  };

  const finishAnalysis = useCallback(() => {
    setTransitionDirection('forward');
    setIsTransitioning(true);
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setScreen('analysis');
      setIsTransitioning(false);
    }, 520);
  }, []);

  const finishPayment = () => {
    if (isPaymentConfirming || isTransitioning) return;
    const destination = paymentOrigin === 'registered-questions' ? 'registered-questions' : orderOrigin;
    setCompletionOrigin(destination);
    setIsPaymentConfirming(true);
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTransitionDirection('forward');
      setScreen('complete');
      setIsPaymentConfirming(false);
    }, 1280);
  };

  const openMore = () => {
    navigate('more');
  };

  const closeMore = () => navigate('home', 'back');
  const closeMoreChild = () => navigate('more', 'back');
  const closeUtilityPage = () => navigate(utilityOrigin, 'back');

  const openUtility = (next: 'inquiry-list' | 'privacy-terms', origin: 'login' | 'signup' | 'home' | 'more') => {
    setUtilityOrigin(origin);
    navigate(next);
  };

  const openReceiptSheet = () => {
    setReceiptIssued(false);
    setReceiptValue('');
    setReceiptMethod('business');
    setReceiptSheetOpen(true);
  };

  const logOut = () => {
    window.localStorage.removeItem(autoLoginKey);
    setDraft(initialDraft);
    setBusinessInfo(initialBusinessInfo);
    navigate('landing', 'back');
  };

  const goBack = () => {
    if (screen === 'competition-review') {
      closeCompetitionReview();
      return;
    }
    const previous: Partial<Record<Screen, Screen>> = {
      goal: orderOrigin, 'analysis-loading': 'goal', analysis: 'goal', competition: 'analysis', plan: 'competition',
      payment: paymentOrigin, complete: 'payment', home: 'landing', 'info-form': 'home',
      history: 'home', report: 'home', more: 'home', login: 'landing', signup: 'login', 'password-reset': 'login',
      'my-info': 'more', inquiry: 'inquiry-list', 'inquiry-list': utilityOrigin, 'inquiry-detail': 'inquiry-list', 'registered-questions': 'more', 'privacy-terms': utilityOrigin, faq: 'more',
    };
    navigate(previous[screen] ?? 'landing', 'back');
  };

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText('GP2026091221414583');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, onChange: (nextLanguage) => setLanguage(nextLanguage) }}>
    <div className="site-canvas">
      <main className="mobile-shell" aria-label="GPTBOT 모바일 서비스" aria-busy={isTransitioning || isPaymentConfirming || screen === 'analysis-loading'}>
        <div key={screen} className={`route-panel route-${transitionDirection}`}>
          {screen === 'landing' && <Landing menuOpen={menuOpen} onMenuChange={setMenuOpen} onStart={() => beginOrder('landing')} onLogin={() => navigate('login')} />}
          {screen === 'goal' && <GoalScreen draft={draft} onBack={goBack} onChange={setDraft} onNext={startAnalysis} />}
          {screen === 'analysis-loading' && <AnalysisLoadingScreen onComplete={finishAnalysis} />}
          {screen === 'analysis' && <AnalysisScreen draft={draft} onBack={goBack} onNext={() => navigate('competition')} />}
          {screen === 'competition' && <CompetitionScreen selected={selectedCompetitor} onSelect={setSelectedCompetitor} onBack={goBack} onNext={() => navigate('plan')} />}
          {screen === 'competition-review' && <CompetitionScreen selected={selectedCompetitor} onSelect={setSelectedCompetitor} onBack={closeCompetitionReview} onNext={closeCompetitionReview} reviewMode />}
          {screen === 'plan' && <PlanScreen onBack={goBack} onNext={() => openPayment('plan')} />}
          {screen === 'payment' && <PaymentScreen onBack={goBack} onClose={goBack} onNext={finishPayment} isProcessing={isPaymentConfirming} />}
          {screen === 'complete' && <CompleteScreen copied={copied} onBack={goBack} onClose={() => navigate(completionOrigin, 'back')} onCopy={copyOrderNumber} onNext={() => navigate('home')} onReceipt={openReceiptSheet} />}
          {(screen === 'home' || screen === 'more') && <ManagementHomeScreen onBack={goBack} />}
          {screen === 'info-form' && <BusinessInfoScreen info={businessInfo} onBack={goBack} onChange={(key, value) => setBusinessInfo((current) => ({ ...current, [key]: value }))} onSave={() => navigate('home')} />}
          {screen === 'history' && <InformationScreen onBack={goBack} onEdit={() => navigate('info-form')} />}
          {screen === 'report' && <ManagementReportScreen onBack={goBack} onRevisit={() => openCompetitionReview('report')} />}
          {screen === 'login' && <LoginScreen onBack={goBack} onLogin={() => navigate('home')} onSignup={() => navigate('signup')} onReset={() => navigate('password-reset')} onInquiry={() => openUtility('inquiry-list', 'login')} onTerms={() => openUtility('privacy-terms', 'login')} />}
          {screen === 'signup' && <SignupScreen onBack={goBack} onSignup={() => navigate('home')} onLogin={() => navigate('login')} onTerms={() => openUtility('privacy-terms', 'signup')} />}
          {screen === 'password-reset' && <PasswordResetScreen onBack={goBack} onLogin={() => navigate('login')} />}
          {screen === 'my-info' && <MyInfoScreen onBack={goBack} onClose={closeMoreChild} onPassword={() => setPasswordSheetOpen(true)} onReceipt={openReceiptSheet} />}
          {screen === 'inquiry' && <InquiryScreen onBack={goBack} onClose={closeUtilityPage} onSubmit={() => navigate('inquiry-list')} />}
          {screen === 'inquiry-list' && <InquiryListScreen onBack={goBack} onClose={closeUtilityPage} onNew={() => navigate('inquiry')} onOpen={(id) => { setActiveInquiryId(id); navigate('inquiry-detail'); }} />}
          {screen === 'inquiry-detail' && <InquiryDetailScreen inquiryId={activeInquiryId} onBack={goBack} onClose={closeUtilityPage} />}
          {screen === 'registered-questions' && <RegisteredQuestionsScreen onBack={goBack} onClose={closeMoreChild} onAdd={() => beginOrder('registered-questions')} onAddDocuments={() => openPayment('registered-questions')} />}
          {screen === 'privacy-terms' && <PrivacyTermsScreen onBack={goBack} onClose={closeUtilityPage} />}
          {screen === 'faq' && <FaqScreen onBack={goBack} onClose={closeMoreChild} />}
        </div>
        {managementNavScreens.includes(screen) && <BottomNav active={screen === 'history' ? 'info' : screen === 'report' ? 'report' : moreNavigationScreens.includes(screen) ? 'more' : 'home'} onHome={() => navigate('home')} onReport={() => navigate('report')} onInfo={() => navigate('history')} onMore={openMore} />}
      </main>
      <MoreDrawer open={screen === 'more'} onClose={closeMore} onQuestions={() => navigate('registered-questions')} onFaq={() => navigate('faq')} onMyInfo={() => navigate('my-info')} onInquiry={() => openUtility('inquiry-list', 'more')} onTerms={() => openUtility('privacy-terms', 'more')} onLogout={logOut} />
      <PasswordChangeSheet open={passwordSheetOpen} onOpenChange={setPasswordSheetOpen} />
      <ReceiptInfoSheet open={receiptSheetOpen} onOpenChange={setReceiptSheetOpen} method={receiptMethod} value={receiptValue} issued={receiptIssued} onMethodChange={setReceiptMethod} onValueChange={setReceiptValue} onIssue={() => setReceiptIssued(true)} />
      {isTransitioning && <RouteLoading />}
      {isPaymentConfirming && <PaymentSuccessTransition />}
      {isSignedInManagementScreen && <HomeActivityTicker visible={tickerVisible} message={activityMessage} typedLength={typedLength} />}
    </div>
    </LanguageContext.Provider>
  );
}

function RouteLoading() {
  return <div className="route-loading" aria-live="polite" aria-label="화면을 준비하고 있습니다"><div className="route-loading-orb" aria-hidden="true"><i /><i /><i /><span>GPTBOT</span></div><p>GPTBOT</p></div>;
}

function PaymentSuccessTransition() {
  return <div className="payment-success-transition" role="status" aria-live="assertive"><div className="payment-success-seal" aria-hidden="true"><Check /></div><p>결제가 완료됐어요</p></div>;
}

function Landing({ menuOpen, onMenuChange, onStart, onLogin }: { menuOpen: boolean; onMenuChange: (open: boolean) => void; onStart: () => void; onLogin: () => void }) {
  const [heroStatsRef, heroStatsVisible] = useOnceInView<HTMLDivElement>();
  const [gptChartRef, gptChartVisible] = useOnceInView<HTMLDivElement>();
  const [changeCardRef, changeCardVisible] = useOnceInView<HTMLButtonElement>();
  const [brandOrbRef, brandOrbVisible] = useViewportOnce<HTMLDivElement>(0.08);

  return <div className="landing">
    <section className="landing-section hero-section" id="top">
      <header className="landing-header">
        <span className="wordmark">GPTBOT</span>
        <div className="landing-actions"><LanguageSelector /><button className="icon-button" type="button" aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={menuOpen} onClick={() => onMenuChange(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
        {menuOpen && <nav className="landing-menu panel" aria-label="랜딩 메뉴"><button className="login-menu-entry" type="button" onClick={onLogin}>로그인 및 가입</button><a href="#why" onClick={() => onMenuChange(false)}>GPT 노출</a><a href="#process" onClick={() => onMenuChange(false)}>진행 과정</a><a href="#pricing" onClick={() => onMenuChange(false)}>이용 가격</a><button type="button" onClick={onStart}>주문 시작</button></nav>}
      </header>
      <div className="hero-copy">
        <p className="eyebrow">GPT MAKES NEW CUSTOMERS</p>
        <h1>GPT 채팅에<br />답변으로<br /><span>노출되도록</span></h1>
        <p className="lead">GPT 광고가 아닙니다<br />GPT 채팅에 당신이 원하는 답변이<br />노출되도록 관리하세요.</p>
        <button className="glow-button" type="button" onClick={onStart}>지금 시작하기 <ArrowRight aria-hidden="true" /></button>
        <a href="#process" className="text-link">서비스 소개 보기 <ChevronRight aria-hidden="true" /></a>
      </div>
      <div className="planet" aria-hidden="true" />
      <div ref={heroStatsRef} className="hero-stats" aria-label="서비스 소개 지표"><div><strong><AnimatedNumber active={heroStatsVisible} value={98} prefix="+" suffix="%" /></strong><span>노출 변화</span></div><div><strong><AnimatedNumber active={heroStatsVisible} value={14.5} decimals={1} suffix="k" delay={100} /></strong><span>이용 업체</span></div><div><strong><AnimatedNumber active={heroStatsVisible} value={5} decimals={1} delay={200} /></strong><span>고객 만족도</span></div></div>
    </section>
    <section className="landing-section why-section" id="why">
      <h2>왜 지금,<br /><span>GPT 답변 노출인가요?</span></h2>
      <p className="section-copy">사람들은 이제 검색보다<br />GPT에게 직접 묻습니다.<br />당신의 비즈니스도 그 답변 안에 있어야 합니다.</p>
      <div ref={gptChartRef} className="gpt-card panel" aria-label="GPT 채널 예시"><GptRow active={gptChartVisible} image="chatgpt" name="ChatGPT" detail="정보 검색·추천·상담" value={81.3} percent="81.3%" index={0} /><GptRow active={gptChartVisible} image="gemini" name="Gemini" detail="자료 조사·검색" value={29.1} percent="29.1%" index={1} /><GptRow active={gptChartVisible} image="claude" name="Claude" detail="개발·분석" value={8} percent="9%" index={2} /></div>
      <div className="why-note panel">지금, GPT 답변에서 보이는 것이<br />새로운 고객을 만나는 가장 빠른 방법입니다.</div>
    </section>
    <section className="landing-section process-section" id="process">
      <h2>어떻게<br /><span>진행되나요?</span></h2>
      <p className="section-copy">복잡한 과정은 저희가 알아서 합니다.<br />당신은 결과만 확인하세요.</p>
      <ol className="process-list">{processSteps.map(([title, detail], index) => <li key={title}><span className="step-number">0{index + 1}</span><div><h3>{title}</h3><p>{detail}</p></div></li>)}</ol>
      <button ref={changeCardRef} className="change-card panel" type="button" onClick={onStart}><span className={`change-chart ${changeCardVisible ? 'chart-active' : ''}`} aria-hidden="true"><i /><i /><i /></span><span>데이터로 증명하는<br /><strong>실제 변화</strong></span><span className="circle-arrow"><ChevronRight aria-hidden="true" /></span></button>
    </section>
    <section className="landing-section pricing-section" id="pricing">
      <h2>합리적인 가격으로<br />시작하세요</h2><p className="section-copy">전문적인 GPT 답변 노출 최적화를<br />부담 없이 이용할 수 있습니다.</p>
      <div className="price-card panel"><div className="price-top"><h3>{productName}</h3><b>60일 관리</b></div><p className="document-count">웹 문서 <strong>25개</strong> 등록</p><p className="price">99,000<span>원</span></p><ul>{['업체 현황 분석', '정보 보강 작업', '노출 테스트 및 기록', '결과 보고서 제공'].map((item) => <li key={item}><span className="check-circle"><Check aria-hidden="true" /></span>{item}</li>)}</ul><button className="white-button" type="button" onClick={onStart}>지금 구매하기 <ArrowRight aria-hidden="true" /></button></div>
      <div className="payment-notes"><div><ShieldCheck aria-hidden="true" /><strong>자동결제 아님</strong><span>30일 단위</span></div><div><CreditCard aria-hidden="true" /><strong>쉽고 빠른 결제</strong><span>신용카드</span></div><div><Sparkles aria-hidden="true" /><strong>구매 후 바로 시작</strong><span>빠른 진행</span></div></div>
    </section>
    <section className="landing-section reviews-section">
      <h2>실제 변화를<br />경험한 사장님들</h2><p className="section-copy">GPT에서도 우리 매장을 추천해준다는<br />게 정말 신기해요.</p>
      <ReviewsCarousel />
    </section>
    <section className="landing-section final-section">
      <h2>지금,<br />GPT 답변에 당신의<br />비즈니스를 보여주세요.</h2><p className="section-copy">더 많은 사람들이 발견하는 브랜드,<br />GPTBOT이 함께합니다.</p>
      <div ref={brandOrbRef} className={`brand-orb ${brandOrbVisible ? 'orb-active' : ''}`} aria-label="GPTBOT GPT VISIBILITY"><strong>GPTBOT</strong><span>GPT VISIBILITY</span></div>
      <button className="white-button" type="button" onClick={onStart}>지금 시작하기 <ArrowRight aria-hidden="true" /></button><footer>GPT 답변이 만드는 새로운 기회<span /></footer>
    </section>
  </div>;
}

function useScreenReveal(delay = 450) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setActive(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return active;
}

function useOnceInView<T extends HTMLElement>(threshold = 0.2, rootMargin = '0px', requireScroll = false) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (requireScroll) {
      const revealAfterScroll = () => {
        if (window.scrollY < 12) return;
        const bottomMargin = rootMargin.trim().split(/\s+/)[2] ?? '0px';
        const offset = bottomMargin.endsWith('%')
          ? (window.innerHeight * Number.parseFloat(bottomMargin)) / 100
          : Number.parseFloat(bottomMargin) || 0;
        const rect = node.getBoundingClientRect();
        const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight + offset) - Math.max(rect.top, 0));
        if (visibleHeight / Math.max(rect.height, 1) >= threshold) setVisible(true);
      };
      window.addEventListener('scroll', revealAfterScroll, { passive: true });
      return () => window.removeEventListener('scroll', revealAfterScroll);
    }
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold, rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [requireScroll, rootMargin, threshold]);

  return [ref, visible] as const;
}

function useViewportOnce<T extends HTMLElement>(threshold = 0.08) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      }, { threshold });
      observer.observe(node);
      return () => observer.disconnect();
    }

    let frame = 0;
    let revealed = false;
    const stopListening = () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleCheck);
      window.removeEventListener('resize', scheduleCheck);
    };
    const checkVisibility = () => {
      if (revealed) return;
      const rect = node.getBoundingClientRect();
      const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      if (visibleHeight / Math.max(rect.height, 1) >= threshold) {
        revealed = true;
        setVisible(true);
        stopListening();
      }
    };
    const scheduleCheck = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(checkVisibility);
    };

    window.addEventListener('scroll', scheduleCheck, { passive: true });
    window.addEventListener('resize', scheduleCheck);
    scheduleCheck();
    return stopListening;
  }, [threshold]);

  return [ref, visible] as const;
}

function useCountUp(value: number, duration = 820, delay = 0, active = true) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let frame = 0;
    if (!active) {
      setCurrent(0);
      return;
    }
    const start = () => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        setCurrent(value * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(start, delay);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [active, delay, duration, value]);

  return current;
}

function AnimatedNumber({ value, decimals = 0, prefix = '', suffix = '', delay = 0, active = true }: { value: number; decimals?: number; prefix?: string; suffix?: string; delay?: number; active?: boolean }) {
  const current = useCountUp(value, 820, delay, active);
  const text = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString('en-US');
  return <>{prefix}{text}{suffix}</>;
}

function GptRow({ active, image, name, detail, value, percent, index }: { active: boolean; image: string; name: string; detail: string; value: number; percent: string; index: number }) {
  const barStyle = { width: active ? percent : '0%', animationDelay: `${index * 120}ms` } as CSSProperties;
  return <div className="gpt-row"><div className={`gpt-logo ${image}`}><img src={`/assets/${image}.png`} alt="" /></div><div className="gpt-data"><div className="gpt-name">{name}</div><div className="gpt-description">{detail}<span><AnimatedNumber active={active} value={value} decimals={1} delay={index * 120} suffix="%" /></span></div><div className={`progress-track ${active ? 'chart-active' : ''}`}><i style={barStyle} /></div></div></div>;
}

function ReviewsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [renderIndex, setRenderIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const touchStart = useRef<number | null>(null);
  const reviewSlides = [...testimonialSlides, testimonialSlides[0]];

  const showSlide = (next: number) => {
    const normalized = (next + testimonialSlides.length) % testimonialSlides.length;
    setIsTransitioning(true);
    setActiveIndex(normalized);
    setRenderIndex(activeIndex === testimonialSlides.length - 1 && normalized === 0 ? testimonialSlides.length : normalized);
  };

  const completeLoop = () => {
    if (renderIndex !== testimonialSlides.length) return;
    setIsTransitioning(false);
    setRenderIndex(0);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setIsTransitioning(true)));
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = window.setInterval(() => {
      showSlide(activeIndex + 1);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [activeIndex]);

  return <div className="review-carousel" role="region" aria-roledescription="carousel" aria-label="이용 업체 후기">
    <div className="review-viewport" onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
      const start = touchStart.current;
      const end = event.changedTouches[0]?.clientX;
      touchStart.current = null;
      if (start === null || end === undefined || Math.abs(start - end) < 34) return;
      showSlide(activeIndex + (start > end ? 1 : -1));
    }}>
      <div className={`review-track ${isTransitioning ? '' : 'is-resetting'}`} style={{ transform: `translateX(-${renderIndex * 100}%)` }} onTransitionEnd={completeLoop}>
        {reviewSlides.map((slide, index) => <div className="review-slide" key={`${slide.map((testimonial) => testimonial.id).join('-')}-${index}`} aria-hidden={index % testimonialSlides.length !== activeIndex}>
          {slide.map((testimonial) => <ReviewCard key={testimonial.id} {...testimonial} />)}
        </div>)}
      </div>
    </div>
    <div className="review-dots" aria-label="후기 슬라이드 선택">
      {testimonialSlides.map((slide, index) => <button key={slide[0].id} className={index === activeIndex ? 'active' : ''} type="button" aria-label={`${index + 1}번째 후기 묶음 보기`} aria-pressed={index === activeIndex} onClick={() => showSlide(index)} />)}
    </div>
  </div>;
}

function ReviewCard({ image, name, category, copy }: Testimonial) {
  const needsTightCrop = image === 'review-realty' || image === 'review-auto';
  return <article className="review-card panel"><span className="quote">“</span><p>{copy}</p><div className="review-author"><span className={`review-photo ${needsTightCrop ? 'tight-crop' : ''}`}><img src={`/assets/${image}.png`} alt="" loading="lazy" decoding="async" /></span><div><strong>{name}</strong><span>{category}</span></div></div></article>;
}

function LanguageSelector() {
  const { language, onChange } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  return <div className="language-selector"><button className="language-trigger" type="button" aria-label={`국가 및 언어 선택: ${language.name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}><span aria-hidden="true">{language.flag}</span><ChevronDown aria-hidden="true" /></button>{open && <div className="language-menu panel" role="menu" aria-label="국가 및 언어 선택">{languageOptions.map((option) => <button key={option.code} className={language.code === option.code ? 'active' : ''} type="button" role="menuitemradio" aria-checked={language.code === option.code} onClick={() => { onChange(option); setOpen(false); }}><span aria-hidden="true">{option.flag}</span>{option.name}</button>)}</div>}</div>;
}

function AppHeader({ title, onBack, onClose = onBack, closeLabel = '닫기', showClose = true }: { title: string; onBack: () => void; onClose?: () => void; closeLabel?: string; showClose?: boolean }) {
  return <header className="app-header"><button className="icon-button" type="button" aria-label="이전 화면" onClick={onBack}><ArrowLeft /></button><h1>{title}</h1><div className="header-actions"><LanguageSelector />{showClose && <button className="icon-button" type="button" aria-label={closeLabel} onClick={onClose}><X /></button>}</div></header>;
}

function StepProgress({ active }: { active: number }) {
  return <div className="step-progress"><p>사전 분석 {active}/4</p><ol>{orderSteps.map((label, index) => { const number = index + 1; const done = number < active; return <li key={label} className={number === active ? 'active' : done ? 'done' : ''} aria-current={number === active ? 'step' : undefined}><span>{done ? <Check aria-hidden="true" /> : number}</span><b>{label}</b></li>; })}</ol></div>;
}

function GradientButton({ children, onClick, disabled = false, direction = 'right' }: { children: ReactNode; onClick: () => void; disabled?: boolean; direction?: 'right' | 'left' }) {
  return <button className="gradient-button" type="button" onClick={onClick} disabled={disabled}>{direction === 'left' && <ArrowLeft aria-hidden="true" />}{children}{direction === 'right' && <ArrowRight aria-hidden="true" />}</button>;
}

function GoalScreen({ draft, onBack, onChange, onNext }: { draft: OrderDraft; onBack: () => void; onChange: (next: OrderDraft) => void; onNext: () => void }) {
  const ready = Boolean(draft.question.trim() && draft.answer.trim());
  return <section className="app-screen order-screen goal-screen"><AppHeader title="주문하기" onBack={onBack} /><StepProgress active={1} /><div className="screen-intro"><h2>GPT에 어떤 질문과<br /><span>답변을 원하시나요?</span></h2><p>원하는 질문과 답변을 간단히 입력하면<br />GPT가 다양한 문장으로 확장합니다.</p></div><div className="form-stack"><label htmlFor="goal-question"><span>목표 질문 <em>필수</em></span><small>{draft.question.length}/200</small></label><Textarea id="goal-question" maxLength={200} value={draft.question} placeholder="잠실에 데이트 장소를 추천해줘" onChange={(event) => onChange({ ...draft, question: event.target.value })} /><p>간략히 적어도 GPT가 여러 문장으로 확장합니다.</p><label htmlFor="goal-answer"><span>원하는 답변 <em>필수</em></span><small>{draft.answer.length}/500</small></label><Textarea id="goal-answer" maxLength={500} value={draft.answer} placeholder="나의 업체 이름" onChange={(event) => onChange({ ...draft, answer: event.target.value })} /><p>추천받고 싶은 업체명이나 답변의 방향을 입력해 주세요.</p></div><aside className="example-card panel"><div><Sparkles aria-hidden="true" /><h3>입력 예시</h3></div><p><b>질문</b> 홍대에서 염색 잘하는 미용실 추천해줘</p><p><b>답변</b> 나의 업체 이름</p></aside><div className="goal-actions">{!ready && <p className="form-error" aria-live="polite">목표 질문과 원하는 답변을 모두 입력해 주세요.</p>}<GradientButton onClick={onNext} disabled={!ready}>분석하기</GradientButton></div><p className="flow-note">사전 분석 → 결제 → 관리 시작</p></section>;
}

function AnalysisLoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [insightIndex, setInsightIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const nextProgress = Math.min(((now - startedAt) / 5000) * 100, 100);
      setProgress(nextProgress);
      if (nextProgress < 100) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    const insightInterval = 5000 / analysisInsights.length;
    const insightTimers = analysisInsights.slice(1).map((_, index) => window.setTimeout(() => setInsightIndex(index + 1), (index + 1) * insightInterval));
    const finishTimer = window.setTimeout(onComplete, 5000);
    return () => {
      window.cancelAnimationFrame(frame);
      insightTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(finishTimer);
    };
  }, [onComplete]);

  const title = analysisInsights[insightIndex];
  const progressValue = Math.round(progress);
  return <section className="app-screen analysis-loading-screen" aria-live="polite"><div className="analysis-loading-header"><p className="analysis-loading-wordmark">GPTBOT</p><LanguageSelector /></div><div className="analysis-orb" aria-hidden="true"><span>GPTBOT</span><small>GPT VISIBILITY</small><i /><i /><i /></div><div className="analysis-loading-copy"><p>GPT 답변 노출 분석 중</p></div><article className="analysis-insight-card panel" key={insightIndex}><span>0{insightIndex + 1}</span><b>{title}</b></article><div className="analysis-progress" aria-label={`분석 진행률 ${progressValue}%`}><div><span>분석 진행 중</span><b>{progressValue}%</b></div><i><b style={{ transform: `scaleX(${progressValue / 100})` }} /></i></div></section>;
}

function AnalysisScreen({ draft, onBack, onNext }: { draft: OrderDraft; onBack: () => void; onNext: () => void }) {
  const dataVisible = useScreenReveal();
  return <section className="app-screen order-screen"><AppHeader title="주문하기" onBack={onBack} /><StepProgress active={2} /><div className="screen-intro compact"><h2>정보 보강이<br /><span>필요해요.</span></h2><p>기본 정보와 외부 언급을 보강하면<br />업체의 특징을 더 명확히 전달할 수 있어요.</p></div><div className="metric-card panel"><p>발견된 웹 문서</p><div><strong><AnimatedNumber active={dataVisible} value={21} /></strong><span>개</span><b>보강 필요</b></div><small>웹 검색 결과에서 확인된 문서 수</small></div><h3 className="section-title">주요 부족한 점</h3><ol className="issue-list"><li><span>1</span><div><b>매장 기본 정보</b><p>위치, 서비스, 가격 정보가 부족해요.</p></div></li><li><span>2</span><div><b>신뢰할 수 있는 외부 언급</b><p>블로그, 리뷰, 커뮤니티 언급이 부족해요.</p></div></li><li><span>3</span><div><b>차별화된 내용</b><p>경쟁 매장과 다른 강점이 잘 드러나지 않아요.</p></div></li></ol><details className="analysis-details"><summary>분석 근거와 입력 내용 <ChevronDown aria-hidden="true" /></summary><p><span>목표 질문</span>{draft.question}</p><p><span>원하는 답변</span>{draft.answer}</p></details><GradientButton onClick={onNext}>경쟁사 비교하기</GradientButton></section>;
}

function CompetitionScreen({ selected, onSelect, onBack, onNext, reviewMode = false }: { selected: string; onSelect: (name: string) => void; onBack: () => void; onNext: () => void; reviewMode?: boolean }) {
  const competitors = [{ name: '나 · 쁘띠헤어', count: 21, width: '7%' }, { name: '1위 프리즘헤어', count: 321, width: '100%' }, { name: '2위 살롱루프', count: 221, width: '69%' }, { name: '3위 어반컷', count: 121, width: '38%' }];
  const [comparisonRef, chartVisible] = useOnceInView<HTMLDivElement>(0.42, '0px 0px -28%', true);
  return <section className="app-screen order-screen"><AppHeader title={reviewMode ? '경쟁사 분석' : '주문하기'} onBack={onBack} closeLabel={reviewMode ? '이전 화면' : '닫기'} />{!reviewMode && <StepProgress active={3} />}<div className={`screen-intro compact ${reviewMode ? 'review-intro' : ''}`}><h2>상위 3곳과<br /><span>비교해 보세요.</span></h2><p>GPT에 동일한 질문을 여러 번 반복해<br />가장 많이 추천되는 업체와 관련 웹 문서 수를<br />비교·분석합니다.</p></div><p className="query-label"><MessageCircle aria-hidden="true" />구월동 미용실 추천</p><div className="compare-heading"><h3>확인된 웹 문서 수</h3><span>단위: 개</span></div><div ref={comparisonRef} className={`comparison-list ${chartVisible ? 'chart-active' : ''}`}>{competitors.map((item, index) => <button type="button" key={item.name} className={`${selected === item.name ? 'selected ' : ''}${index > 0 ? 'competitor' : ''}`.trim()} onClick={() => onSelect(item.name)}><span>{item.name}</span><strong><AnimatedNumber active={chartVisible} value={item.count} delay={index * 120} /></strong><i><b style={{ width: chartVisible ? item.width : '0%', animationDelay: `${index * 120}ms` }} /></i></button>)}</div><p className="helper-copy">업체를 선택하면 아래 분석을 확인할 수 있어요.</p><div className="selection-summary"><span>선택한 업체</span><div><b>{selected}</b><em>보강 필요</em></div><p>기본 정보와 외부 언급이 부족하고, 경쟁 매장과 다른 강점을 보강할 필요가 있어요.</p><small>웹 문서 수는 추천 노출률을 의미하지 않습니다.</small></div>{reviewMode ? <GradientButton onClick={onNext} direction="left">이전</GradientButton> : <GradientButton onClick={onNext}>진행 계획 보기</GradientButton>}</section>;
}

function PlanScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const work = [['핵심 정보 분석', 'GPT 수집에 필요한 정보를 분석합니다.'], ['정리 및 웹 배포', '선정한 내용을 정리해 웹에 배포합니다.'], ['GPT 반영 확인', '배포한 정보가 GPT 답변에 반영되는지 확인합니다.'], ['추가 보완', '노출 현황에 따라 필요한 내용을 보강합니다.'], ['결과 기록', '작업 내용을 기록하고 공유합니다.']];
  return <section className="app-screen order-screen"><AppHeader title="주문하기" onBack={onBack} /><StepProgress active={4} /><div className="screen-intro compact"><h2>이렇게<br /><span>진행합니다.</span></h2><p>GPT가 직접 노출 결과와 수집 정보를 분석하고,<br />이를 바탕으로 정보를 정리해 최적화된 문서를<br />제작·배포합니다.</p></div><div className="period-card panel"><Clock3 aria-hidden="true" /><div><span>예상 기간</span><strong>30일</strong></div><p>작업량과 검색 반영 속도에 따라<br />일정이 달라질 수 있어요.</p></div><ol className="work-plan">{work.map(([title, detail], index) => <li key={title}><span>0{index + 1}</span><div><b>{title}</b><p>{detail}</p></div></li>)}</ol><GradientButton onClick={onNext}>결제로 이동</GradientButton></section>;
}

function PaymentScreen({ onBack, onClose, onNext, isProcessing }: { onBack: () => void; onClose: () => void; onNext: () => void; isProcessing: boolean }) {
  return <section className="app-screen payment-screen"><AppHeader title="결제" onBack={onBack} onClose={onClose} /><div className="screen-intro"><h2>상품을 확인하고<br /><span>결제해 주세요.</span></h2></div><div className="payment-card panel"><div className="payment-product-heading"><h3>{productName}</h3><span>60일 관리</span></div><p className="document-count">웹 문서 <strong>25개</strong> 등록</p><div className="payment-price"><strong>99,000</strong><span>원</span><b>VAT 포함</b></div><ul><li><Check aria-hidden="true" />현황 분석</li><li><Check aria-hidden="true" />정보 보강</li><li><Check aria-hidden="true" />노출 테스트</li><li><Check aria-hidden="true" />결과 기록</li></ul></div><h3 className="section-title">결제 수단</h3><button className="payment-method" type="button"><CreditCard aria-hidden="true" /><span><b>신용카드</b><small>•••• 0941</small></span><em>변경</em><ChevronRight aria-hidden="true" /></button><div className="payment-total"><h3>결제 금액</h3><p><span>상품 금액</span><b>99,000원</b></p><p><span>부가세</span><b>포함</b></p><hr /><strong><span>총 결제 금액</span>99,000원</strong></div><GradientButton onClick={onNext} disabled={isProcessing}>99,000원 결제하기</GradientButton></section>;
}

function CompleteScreen({ copied, onBack, onClose, onCopy, onNext, onReceipt }: { copied: boolean; onBack: () => void; onClose: () => void; onCopy: () => void; onNext: () => void; onReceipt: () => void }) {
  return <section className="app-screen completion-screen"><AppHeader title="결제 완료" onBack={onBack} onClose={onClose} closeLabel="이전 화면" /><div className="screen-intro"><h2>결제가<br /><span>완료됐어요.</span></h2><p>오늘부터 바로 시작할 수 있어요.</p></div><h3 className="section-title">결제 내역</h3><div className="receipt-card panel"><h4>{productName}</h4><div><strong>99,000원</strong><span>VAT 포함</span></div><hr /><dl><div><dt>결제 수단</dt><dd>신용카드 •••• 0941</dd></div><div><dt>결제 일시</dt><dd>2026. 09. 12. 21:41</dd></div><div><dt>주문 번호</dt><dd>GP2026091221414583 <button type="button" onClick={onCopy} aria-label="주문 번호 복사"><Copy aria-hidden="true" /></button></dd></div></dl>{copied && <p className="copied-state" aria-live="polite">주문 번호를 복사했습니다.</p>}</div><button className="invoice-link" type="button" onClick={onReceipt}>계산서 발행 <ChevronRight aria-hidden="true" /></button><GradientButton onClick={onNext}>관리 홈으로</GradientButton></section>;
}

function ManagementHomeScreen({ onBack }: { onBack: () => void }) {
  const statsVisible = useScreenReveal();
  const [scheduleTab, setScheduleTab] = useState<'전체' | '인용'>('전체');

  const timeline = scheduleTab === '전체'
    ? [
      ['오늘', '핵심 문서 2건의 진행 상태를 점검하고 우선순위가 높은 순서대로 확인 예정'],
      ['내일', '대기 문서의 요약 내용을 정리하고 인용 가능 여부를 다시 검토 예정'],
      ['4일 후', '주간 문서 현황을 한 번 더 점검하고 보고서 대상 문서를 확정 예정'],
    ]
    : [
      ['오늘', '인용 성공 문서 3건의 출처와 반영 상태를 확인 예정'],
      ['내일', '추가 인용 후보 문서를 검토하고 우선순위를 정리 예정'],
      ['4일 후', '인용 결과를 반영한 주간 보고서를 준비 예정'],
    ];

  return <section className="app-screen management-home-screen">
    <AppHeader title="홈" onBack={onBack} showClose={false} />
    <button className="management-question-select panel" type="button"><FileText aria-hidden="true" /><span>구월동 미용실 추천</span><ChevronDown aria-hidden="true" /></button>
    <section className="management-summary panel" aria-label="문서 현황">
      <div><span className="summary-icon"><FileText aria-hidden="true" /></span><p>총 문서 수</p><strong><AnimatedNumber active={statsVisible} value={10} /></strong></div>
      <div><span className="summary-icon"><Clock3 aria-hidden="true" /></span><p>등록 예정</p><strong><AnimatedNumber active={statsVisible} value={3} delay={90} /></strong></div>
      <div><span className="summary-icon"><Check aria-hidden="true" /></span><p>등록 완료</p><strong><AnimatedNumber active={statsVisible} value={7} delay={180} /></strong></div>
      <div className="citation-success"><span className="summary-icon"><Link2 aria-hidden="true" /></span><p>인용 성공</p><strong><AnimatedNumber active={statsVisible} value={3} delay={270} /></strong></div>
    </section>
    <section className="schedule-section">
      <div className="management-section-heading"><h2>스케줄</h2><div className="schedule-tabs" role="tablist" aria-label="스케줄 보기"><button type="button" className={scheduleTab === '전체' ? 'active' : ''} onClick={() => setScheduleTab('전체')}>전체</button><button type="button" className={scheduleTab === '인용' ? 'active' : ''} onClick={() => setScheduleTab('인용')}>인용</button></div></div>
      <ol className="management-timeline">{timeline.map(([date, description], index) => <li className={index === 0 ? 'today' : ''} key={date}><i aria-hidden="true" /><div><time>{date}</time><p>{description}</p></div></li>)}</ol>
    </section>
    <section className="management-document-log" aria-label="최근 문서 기록">
      <article><time>5일 전</time><div><b>문서 요약 한줄</b><p><span className="success-dot" />GPT 인용됨 (2일 전) · 최종 확인 3시간 전</p><small className="next-check">다음 확인 <b>3일 뒤</b></small></div></article>
      <article><time>10일 전</time><div><b>문서 요약 한줄</b><p><span />미 인용 · 최종 확인 1일 전</p><small className="next-check">다음 확인 <b>3일 뒤</b></small></div></article>
    </section>
  </section>;
}

function InformationScreen({ onBack, onEdit }: { onBack: () => void; onEdit: () => void }) {
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const ready = Boolean(content.trim() || attachment);

  return <section className="app-screen information-screen">
    <AppHeader title="정보" onBack={onBack} showClose={false} />
    <button className="management-question-select panel" type="button"><FileText aria-hidden="true" /><span>구월동 미용실 추천</span><ChevronDown aria-hidden="true" /></button>
    <section className="information-needed">
      <div className="management-section-heading"><h2>필요한 정보</h2><button type="button" onClick={onEdit}>전체보기</button></div>
      <p>문서 등록에 필요한 정보 중 웹에서<br />확인되지 않는 내용을 입력·첨부해 주세요.</p>
      <label className="information-field" htmlFor="price-and-reservation"><textarea id="price-and-reservation" aria-label="가격과 예약 조건" value={content} placeholder="가격과 예약 방법을 입력해 주세요." onChange={(event) => { setContent(event.target.value); setSubmitted(false); }} /></label>
      <div className="information-actions"><label className="attachment-trigger"><Paperclip aria-hidden="true" /><span>{attachment || '이미지 · 문서 첨부'}</span><input type="file" accept="image/*,.pdf,.doc,.docx" onChange={(event) => { setAttachment(event.target.files?.[0]?.name ?? ''); setSubmitted(false); }} /></label><button className="management-primary-button information-submit" type="button" disabled={!ready} onClick={() => setSubmitted(true)}>제출하기</button></div>
      {submitted && <p className="information-saved" role="status">정보를 제출했어요. 문서 반영을 준비합니다.</p>}
    </section>
    <section className="confirmed-information">
      <div className="management-section-heading"><h2>확인된 정보</h2><button type="button" onClick={onEdit}>전체보기</button></div>
      <article><span>지역</span><div><b>구월동</b><button type="button" onClick={onEdit}>수정</button></div></article>
      <article><span>업종</span><div><b>미용실</b><button type="button" onClick={onEdit}>수정</button></div></article>
    </section>
  </section>;
}

function ManagementReportScreen({ onBack, onRevisit }: { onBack: () => void; onRevisit: () => void }) {
  return <section className="app-screen management-report-screen">
    <AppHeader title="보고서" onBack={onBack} showClose={false} />
    <button className="management-question-select panel" type="button"><FileText aria-hidden="true" /><span>구월동 미용실 추천</span><ChevronDown aria-hidden="true" /></button>
    <h2 className="management-page-title">분석 결과</h2>
    <section className="report-progress-list" aria-label="분석 결과 진행 상태">
      <article className="report-progress-card registered">
        <header><div><span className="report-progress-icon"><FileText aria-hidden="true" /></span><h3>등록 완료</h3></div><b>문서 3개</b></header>
        <p>GPT 반영이 부족한 <strong>가격 · 예약 조건</strong> 정보를 등록하였습니다.</p>
        <footer><span>반영 <b>2주 예상</b></span><span>인용 <b>4~6주 예상</b></span></footer>
      </article>
      <article className="report-progress-card cited">
        <header><div><span className="report-progress-icon"><Check aria-hidden="true" /></span><h3>인용 성공</h3></div><b>문서 2개</b></header>
        <p>GPT가 <strong>업체 소개 · 지역 정보</strong>를 인용하기 시작했습니다.</p>
        <footer><span>목표 노출 점수 반영까지 <b>12주 예상</b></span></footer>
      </article>
      <article className="report-progress-card needed">
        <header><div><span className="report-progress-icon"><Info aria-hidden="true" /></span><h3>보강 필요</h3></div><b>문서 2개</b></header>
        <p>GPT에서 <strong>가격 · 예약 조건</strong>에 대한 정보가 경쟁사에 비해 약합니다.</p>
        <footer><span><b className="schedule-accent">3일 후</b> 등록</span><span><b className="schedule-accent">10일 후</b>부터 체크</span></footer>
      </article>
    </section>
    <button className="competition-link" type="button" onClick={onRevisit}><span>경쟁사 분석 보기<small>5일 전 갱신</small></span><ChevronDown aria-hidden="true" /></button>
  </section>;
}

function HomeScreen({ onHistory, onReport, onInfo, onMore, onBack, onAddPass, onQuestions }: { onHistory: () => void; onReport: () => void; onInfo: () => void; onMore: () => void; onBack: () => void; onAddPass: () => void; onQuestions: () => void }) {
  const dashboardStatsVisible = useScreenReveal();

  return <section className="app-screen dashboard-screen">
    <header className="dashboard-header"><button className="wordmark app-wordmark" type="button" onClick={onBack}>GPTBOT</button><div className="dashboard-actions"><LanguageSelector /><button className="icon-button" type="button" aria-label="알림"><Bell /></button></div></header>
    <div className="business-heading"><div><h1>쁘띠헤어</h1><button className="business-pass-link" type="button" onClick={onAddPass}>이용권 추가하기 <ChevronRight aria-hidden="true" /></button></div><span className="status in-progress">작업 중</span></div>
    <button className="alert-strip" type="button" onClick={onInfo}><span className="alert-icon" aria-hidden="true"><Info /></span><span>정보를 입력해주세요</span><ChevronRight aria-hidden="true" /></button>
    <div className="dashboard-stats"><div><span>문서 수</span><strong><AnimatedNumber active={dashboardStatsVisible} value={32} /><small>건</small></strong></div><div><span>대기</span><strong><AnimatedNumber active={dashboardStatsVisible} value={11} delay={100} /><small>건</small></strong></div><div><span>완료</span><strong><AnimatedNumber active={dashboardStatsVisible} value={3} delay={200} /><small>건</small></strong></div></div>
    <SectionHeading title="최근 작업" action="더보기" onAction={onHistory} />
    <ul className="activity-list"><li><div><b>외부 문서 2건 반영</b><small>14:20</small></div><span className="status done">완료</span></li><li><div><b>테스트 질문 세트 업데이트</b><small>10:30</small></div><span className="status done">완료</span></li><li><div><b>지역 키워드 보강</b><small>오늘 중 완료 예정</small></div><span className="status in-progress">진행 중</span></li></ul>
    <div className="dashboard-section-divider" aria-hidden="true" />
    <SectionHeading title="GPT 노출 목록" action="더보기" onAction={onQuestions} />
    <ul className="question-list"><li><b>구월동에 좋은 미용실 추천해줘</b><span>문서 4건 · 1시간 전 <em>완료</em></span></li><li><b>염색 잘하는 미용실 어디인가요?</b><span>문서 3건 · 6시간 전 <em className="blue">작업 중</em></span></li><li><b>인천에서 커트 잘하는 곳 알려주세요</b><span>문서 2건 · 1일 전 <em className="gray">대기</em></span></li></ul>
  </section>;
}

function BusinessInfoScreen({ info, onBack, onChange, onSave }: { info: BusinessInfo; onBack: () => void; onChange: (key: BusinessInfoKey, value: string) => void; onSave: () => void }) {
  const ready = Object.values(info).every((value) => value.trim().length > 0);
  return <section className="app-screen business-info-screen"><AppHeader title="정보 입력" onBack={onBack} closeLabel="홈으로" /><div className="screen-intro compact"><h2>정확한 정보가<br /><span>필요합니다.</span></h2><p>GPT가 업체를 정확히 이해할 수 있도록<br />기본 정보를 입력해 주세요.</p></div><div className="business-info-form">{businessInfoFields.map((field, index) => <label key={field.key} htmlFor={`business-${field.key}`}><span><b>{index + 1}. {field.label}</b><em>필수</em></span><input id={`business-${field.key}`} type="text" required value={info[field.key]} placeholder={field.placeholder} maxLength={120} onChange={(event) => onChange(field.key, event.target.value)} /></label>)}</div><GradientButton onClick={onSave} disabled={!ready}>저장</GradientButton></section>;
}

function HistoryScreen({ onBack }: { onBack: () => void; onHome: () => void; onReport: () => void; onMore: () => void }) {
  return <section className="app-screen history-screen"><AppHeader title="작업 기록" onBack={onBack} closeLabel="홈으로" /><div className="category-actions"><button className="question-select compact-select" type="button"><MessageCircle aria-hidden="true" />구월동 미용실 추천<ChevronDown aria-hidden="true" /></button></div><h2 className="screen-label">오늘</h2><ol className="record-list"><Record time="14:20" title="외부 문서 2건 반영" status="완료" state="done" /><Record time="10:30" title="테스트 질문 세트 업데이트" status="완료" state="done" /><Record time="09:10" title="업체 상세 소개 문구 정리" status="완료" state="done" /><Record time="오늘 중" title="지역 키워드 보강" status="진행 중" state="in-progress" selected /></ol><h2 className="screen-label future">예정</h2><ol className="record-list"><Record time="내일" title="경쟁업체 분석" status="대기" state="waiting" /></ol><div className="record-detail"><span>선택한 작업</span><h2>지역 키워드 보강</h2><p>오늘 중 완료 예정</p><p>구월동, 인천, 미용실 관련 지역 키워드를 추가하여 지역 연관성을 보강합니다.</p><button type="button"><FileText aria-hidden="true" />관련 문서 보기<ChevronRight aria-hidden="true" /></button></div></section>;
}

function Record({ time, title, status, state, selected = false }: { time: string; title: string; status: string; state: string; selected?: boolean }) {
  return <li className={selected ? 'selected' : ''}><time>{time}</time><b>{title}</b><span className={`status ${state}`}>{status}</span></li>;
}

function ReportScreen({ onBack, onHistory, onRevisit }: { onBack: () => void; onHome: () => void; onHistory: () => void; onMore: () => void; onRevisit: () => void }) {
  return <section className="app-screen report-screen"><AppHeader title="정보 분석" onBack={onBack} closeLabel="홈으로" /><div className="category-actions"><button className="question-select compact-select" type="button"><MessageCircle aria-hidden="true" />구월동 미용실 추천<ChevronDown aria-hidden="true" /></button></div><div className="screen-intro compact"><h2>비즈니스 정보를<br /><span>이렇게 분석했어요.</span></h2><p>확인된 정보와 추가로 필요한 내용을<br />나눠 확인할 수 있어요.</p></div><ReportCard variant="confirmed" icon={<Check aria-hidden="true" />} title="확인된 정보" count="4개"><p>현재 확인된 업체 관련 정보입니다.</p><ul><li>구월동</li><li>미용실</li><li>염색</li><li>예약</li></ul></ReportCard><ReportCard variant="missing" icon={<Info aria-hidden="true" />} title="부족한 정보" count="3개"><p>추가로 보강이 필요한 내용입니다.</p><ul className="rows"><li>가격대 <em>보강 필요</em></li><li>후기 근거 <em>보강 필요</em></li><li>차별점 <em>보강 필요</em></li></ul></ReportCard><ReportCard variant="recent" icon={<FileText aria-hidden="true" />} title="최근 보강" count="3개"><p>최근 추가된 정보입니다.</p><ul className="checks"><li>업체 소개 문구</li><li>지역 키워드</li><li>외부 문서 2건</li></ul></ReportCard><button className="activity-link" type="button" onClick={onHistory}>작업 기록 보기 <ChevronRight aria-hidden="true" /></button><button className="analysis-revisit report-revisit" type="button" onClick={onRevisit}><span><b>경쟁사 분석 다시보기</b><small>이전에 확인한 분석 결과를 다시 볼 수 있어요.</small></span><ChevronRight aria-hidden="true" /></button></section>;
}

function ReportCard({ variant, icon, title, count, children }: { variant: string; icon: ReactNode; title: string; count: string; children: ReactNode }) {
  return <section className={`report-card panel ${variant}`}><header><span>{icon}</span><h3>{title}</h3><b>{count}</b></header>{children}</section>;
}

function SectionHeading({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return <div className="section-heading"><h2>{title}</h2><button type="button" onClick={onAction}>{action}<ChevronRight aria-hidden="true" /></button></div>;
}

function BottomNav({ active, onHome, onReport, onInfo, onMore }: { active: 'home' | 'report' | 'info' | 'more'; onHome: () => void; onReport: () => void; onInfo: () => void; onMore: () => void }) {
  return <nav className="bottom-nav" aria-label="고객 메뉴"><button className={active === 'home' ? 'active' : ''} type="button" aria-current={active === 'home' ? 'page' : undefined} onClick={onHome}><Home aria-hidden="true" /><span>홈</span></button><button className={active === 'report' ? 'active' : ''} type="button" aria-current={active === 'report' ? 'page' : undefined} onClick={onReport}><BarChart3 aria-hidden="true" /><span>보고서</span></button><button className={active === 'info' ? 'active' : ''} type="button" aria-current={active === 'info' ? 'page' : undefined} onClick={onInfo}><FileText aria-hidden="true" /><span>정보</span></button><button className={active === 'more' ? 'active' : ''} type="button" aria-current={active === 'more' ? 'page' : undefined} onClick={onMore}><MoreHorizontal aria-hidden="true" /><span>더보기</span></button></nav>;
}

function MoreDrawer({ open, onClose, onQuestions, onFaq, onMyInfo, onInquiry, onTerms, onLogout }: { open: boolean; onClose: () => void; onQuestions: () => void; onFaq: () => void; onMyInfo: () => void; onInquiry: () => void; onTerms: () => void; onLogout: () => void }) {
  return <Sheet open={open} onOpenChange={(next) => !next && onClose()}><SheetContent side="right" showCloseButton={false} className="more-sheet"><div className="more-header"><SheetTitle>더보기</SheetTitle><div className="more-header-actions"><LanguageSelector /><SheetClose asChild><button className="icon-button" type="button" aria-label="더보기 닫기"><X /></button></SheetClose></div></div><div className="more-profile" aria-label="GPTBOT GPT VISIBILITY"><div className="brand-orb more-brand-orb"><strong>GPTBOT</strong><span>GPT VISIBILITY</span></div></div><nav className="more-menu" aria-label="더보기 메뉴"><button type="button" onClick={onQuestions}><FileText aria-hidden="true" />GPT 노출 목록<ChevronRight aria-hidden="true" /></button><button type="button" onClick={onFaq}><Info aria-hidden="true" />궁금해요<ChevronRight aria-hidden="true" /></button><button type="button" onClick={onMyInfo}><UserRound aria-hidden="true" />내 정보<ChevronRight aria-hidden="true" /></button><button type="button" onClick={onInquiry}><MessageCircle aria-hidden="true" />문의<ChevronRight aria-hidden="true" /></button><button type="button" onClick={onTerms}><ShieldCheck aria-hidden="true" />개인정보 및 약관<ChevronRight aria-hidden="true" /></button></nav><div className="more-footer"><button className="logout-button" type="button" onClick={onLogout}><LogOut aria-hidden="true" />로그아웃</button></div></SheetContent></Sheet>;
}

function SimpleHeader({ title, onBack, onClose }: { title: string; onBack: () => void; onClose?: () => void }) {
  return <header className="simple-header"><button className="icon-button" type="button" aria-label="이전 화면" onClick={onBack}><ArrowLeft /></button><h1>{title}</h1><div className="header-actions"><LanguageSelector />{onClose && <button className="icon-button" type="button" aria-label="닫기" onClick={onClose}><X /></button>}</div></header>;
}

function PasswordField({ id, label, value, onChange, placeholder, autoComplete = 'current-password', minLength }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string; autoComplete?: string; minLength?: number }) {
  const [visible, setVisible] = useState(false);
  return <label className="account-field" htmlFor={id}><span>{label}</span><div className="input-with-action"><input id={id} name={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} minLength={minLength} required value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /><button type="button" aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff /> : <Eye />}</button></div></label>;
}

function LoginScreen({ onBack, onLogin, onSignup, onReset, onInquiry, onTerms }: { onBack: () => void; onLogin: () => void; onSignup: () => void; onReset: () => void; onInquiry: () => void; onTerms: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const savedId = window.localStorage.getItem(savedLoginIdKey);
    if (savedId) {
      setEmail(savedId);
      setRememberId(true);
    }
    setAutoLogin(window.localStorage.getItem(autoLoginKey) === 'true');
  }, []);

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== testLogin.email || password !== testLogin.password) {
      setLoginError('가입 이메일 또는 비밀번호를 확인해 주세요.');
      return;
    }
    if (rememberId) {
      window.localStorage.setItem(savedLoginIdKey, normalizedEmail);
      const PasswordCredentialConstructor = (window as Window & { PasswordCredential?: new (form: HTMLFormElement) => Credential }).PasswordCredential;
      if (PasswordCredentialConstructor && navigator.credentials?.store) {
        void navigator.credentials.store(new PasswordCredentialConstructor(event.currentTarget)).catch(() => undefined);
      }
    } else window.localStorage.removeItem(savedLoginIdKey);
    if (autoLogin) window.localStorage.setItem(autoLoginKey, 'true');
    else window.localStorage.removeItem(autoLoginKey);
    setLoginError('');
    onLogin();
  };
  return <section className="app-screen account-screen login-screen"><SimpleHeader title="로그인" onBack={onBack} /><div className="account-intro"><h2>GPTBOT</h2><p>가입한 이메일로 로그인하세요.</p></div><form className="account-form" onSubmit={submitLogin}><label className="account-field" htmlFor="login-email"><span>가입 메일</span><input id="login-email" name="username" type="email" autoComplete="username" required value={email} placeholder="이메일을 입력해 주세요" onChange={(event) => { setEmail(event.target.value); setLoginError(''); }} /></label><PasswordField id="login-password" label="비밀번호" value={password} placeholder="비밀번호를 입력해 주세요" autoComplete="current-password" onChange={(value) => { setPassword(value); setLoginError(''); }} /><div className="login-options" role="group" aria-label="로그인 저장 옵션"><label><input type="checkbox" checked={rememberId} onChange={(event) => setRememberId(event.target.checked)} /><span>로그인 저장</span></label><label><input type="checkbox" checked={autoLogin} onChange={(event) => setAutoLogin(event.target.checked)} /><span>자동 로그인</span></label></div>{loginError && <p className="form-error" role="alert">{loginError}</p>}<button className="inline-link" type="button" onClick={onReset}>비밀번호 찾기</button><button className="gradient-button account-cta" type="submit">로그인</button></form><p className="account-switch">계정이 없으신가요? <button type="button" onClick={onSignup}>가입하기</button></p><footer className="account-footer"><button type="button" onClick={onInquiry}>문의</button><span>·</span><button type="button" onClick={onTerms}>개인정보 및 약관</button></footer></section>;
}

function SignupScreen({ onBack, onSignup, onLogin, onTerms }: { onBack: () => void; onSignup: () => void; onLogin: () => void; onTerms: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const validPassword = password.length >= 8;
  const passwordsMatch = validPassword && password === confirmPassword;
  const passwordError = password && !validPassword
    ? '비밀번호는 8자 이상 입력해 주세요.'
    : confirmPassword && password !== confirmPassword
      ? '비밀번호가 일치하지 않습니다.'
      : '';
  return <section className="app-screen account-screen signup-screen"><SimpleHeader title="가입" onBack={onBack} /><div className="screen-intro account-signup-intro"><h2>계정을 만들어 주세요.</h2><p>이메일과 비밀번호로 가입할 수 있어요.</p></div><form className="account-form signup-form" onSubmit={(event) => { event.preventDefault(); if (passwordsMatch) onSignup(); }}><label className="account-field" htmlFor="signup-email"><span>가입 메일</span><input id="signup-email" type="email" required value={email} placeholder="이메일을 입력해 주세요" onChange={(event) => setEmail(event.target.value)} /></label><PasswordField id="signup-password" label="비밀번호" value={password} placeholder="8자 이상 입력해 주세요" minLength={8} onChange={setPassword} /><PasswordField id="signup-password-confirm" label="비밀번호 확인" value={confirmPassword} placeholder="비밀번호를 다시 입력해 주세요" minLength={8} onChange={setConfirmPassword} /><p className="agreement-copy">가입하면 <button type="button" onClick={onTerms}>이용약관</button> 및 <button type="button" onClick={onTerms}>개인정보처리방침</button>에 동의합니다.</p>{passwordError && <p className="form-error">{passwordError}</p>}<button className="gradient-button account-cta" type="submit" disabled={!email || !passwordsMatch}>가입하기</button></form><p className="account-switch">이미 계정이 있으신가요? <button type="button" onClick={onLogin}>로그인</button></p></section>;
}

function PasswordResetScreen({ onBack, onLogin }: { onBack: () => void; onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return <section className="app-screen account-screen password-reset-screen"><SimpleHeader title="비밀번호 찾기" onBack={onBack} /><div className="account-intro"><h2>GPTBOT</h2><p>가입한 이메일로 비밀번호 재설정 링크를<br />보내드립니다.</p></div><form className="account-form reset-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><label className="account-field" htmlFor="reset-email"><span>가입 메일</span><input id="reset-email" type="email" required value={email} placeholder="이메일을 입력해 주세요" onChange={(event) => setEmail(event.target.value)} /></label><button className="gradient-button account-cta" type="submit">{sent ? '재설정 링크를 보냈어요' : '재설정 링크 보내기'}</button>{sent && <p className="sheet-confirmation" role="status">입력한 이메일로 재설정 링크를 보냈어요.</p>}</form><footer className="account-footer single"><button type="button" onClick={onLogin}>로그인</button></footer></section>;
}

function MyInfoScreen({ onBack, onClose, onPassword, onReceipt }: { onBack: () => void; onClose: () => void; onPassword: () => void; onReceipt: () => void }) {
  return <section className="app-screen my-info-screen"><SimpleHeader title="내 정보" onBack={onBack} onClose={onClose} /><section className="info-block"><h2>가입 메일</h2><p className="info-email">petit@example.com</p><button className="setting-row" type="button" onClick={onPassword}><span>비밀번호 변경</span><ChevronRight aria-hidden="true" /></button></section><section className="info-block"><h2>이용 중 서비스</h2><div className="service-summary panel"><div><span>{productName}</span><strong>99,000원</strong></div><small>부가세 포함</small></div></section><section className="info-block payment-history-block"><h2>결제 기록</h2><article className="payment-record"><time>2026. 09. 12</time><div><strong>99,000원</strong><span>{productName}</span></div></article></section><button className="receipt-action" type="button" onClick={onReceipt}><ReceiptText aria-hidden="true" /><span>영수증 정보 입력</span><ChevronRight aria-hidden="true" /></button></section>;
}

function InquiryScreen({ onBack, onClose, onSubmit }: { onBack: () => void; onClose: () => void; onSubmit: () => void }) {
  const [kind, setKind] = useState('서비스 문의');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  return <section className="app-screen inquiry-screen"><SimpleHeader title="문의" onBack={onBack} onClose={onClose} /><div className="screen-intro inquiry-intro"><h2>문의 내용을<br /><span>남겨 주세요.</span></h2><p>답변을 받을 이메일을 함께 입력해 주세요.</p></div><form className="account-form inquiry-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><label className="account-field" htmlFor="inquiry-kind"><span>문의 유형</span><select id="inquiry-kind" value={kind} onChange={(event) => setKind(event.target.value)}><option>서비스 문의</option><option>결제 문의</option><option>작업 문의</option><option>기타</option></select></label><label className="account-field" htmlFor="inquiry-email"><span>답변 받을 메일</span><input id="inquiry-email" type="email" required value={email} placeholder="이메일을 입력해 주세요" onChange={(event) => setEmail(event.target.value)} /></label><label className="account-field" htmlFor="inquiry-title"><span>문의 제목</span><input id="inquiry-title" type="text" required value={title} placeholder="제목을 입력해 주세요" onChange={(event) => setTitle(event.target.value)} /></label><label className="account-field" htmlFor="inquiry-body"><span>문의 내용</span><Textarea id="inquiry-body" required value={body} placeholder="문의 내용을 자세히 입력해 주세요." onChange={(event) => setBody(event.target.value)} /></label><button className="gradient-button account-cta" type="submit">문의 보내기</button></form></section>;
}

const inquiries: Array<{ id: InquiryId; status: '답변 대기' | '답변 완료'; state: 'waiting' | 'done'; title: string; date: string; kind: string; content: string; reply: string }> = [
  { id: 'documents', status: '답변 대기', state: 'waiting', title: '등록 문서 수를 변경하고 싶어요.', date: '2026. 09. 15', kind: '서비스 문의', content: '등록할 문서 수와 하루 최대 등록 수를 변경하고 싶어요.', reply: '답변을 준비 중이에요. 등록되는 대로 이 문의에서 확인할 수 있어요.' },
  { id: 'payment', status: '답변 완료', state: 'done', title: '결제 내역 확인 문의', date: '2026. 09. 12', kind: '결제 문의', content: '결제한 내역과 영수증 발행 방법을 확인하고 싶어요.', reply: '결제 내역은 내 정보의 결제 기록에서 확인할 수 있어요. 영수증 정보 입력 후 발행을 요청해 주세요.' },
];

function InquiryListScreen({ onBack, onClose, onNew, onOpen }: { onBack: () => void; onClose: () => void; onNew: () => void; onOpen: (id: InquiryId) => void }) {
  return <section className="app-screen inquiry-list-screen"><SimpleHeader title="문의 목록" onBack={onBack} onClose={onClose} /><div className="inquiry-list-heading"><p>남긴 문의와 답변을 확인할 수 있어요.</p><button type="button" onClick={onNew}><Plus aria-hidden="true" />문의 작성</button></div><ol className="inquiry-list">{inquiries.map((inquiry) => <li key={inquiry.id}><button type="button" onClick={() => onOpen(inquiry.id)} aria-label={`${inquiry.title} ${inquiry.status} 보기`}><div><span className={`status ${inquiry.state}`}>{inquiry.status}</span><b>{inquiry.title}</b><small>{inquiry.date} · {inquiry.kind}</small></div><ChevronRight aria-hidden="true" /></button></li>)}</ol></section>;
}

function InquiryDetailScreen({ inquiryId, onBack, onClose }: { inquiryId: InquiryId; onBack: () => void; onClose: () => void }) {
  const inquiry = inquiries.find((item) => item.id === inquiryId) ?? inquiries[0];
  return <section className="app-screen inquiry-detail-screen"><SimpleHeader title="문의 답변" onBack={onBack} onClose={onClose} /><div className="inquiry-detail-heading"><span className={`status ${inquiry.state}`}>{inquiry.status}</span><h2>{inquiry.title}</h2><p>{inquiry.date} · {inquiry.kind}</p></div><section className="inquiry-message-card panel"><span>문의 내용</span><p>{inquiry.content}</p></section><section className="inquiry-message-card panel reply"><span>답변</span><p>{inquiry.reply}</p></section></section>;
}

const registeredQuestions = [
  { title: '구월동 맛집 추천', detail: '구월동 골목집 돼지갈비를 추천해주세요.', documents: '문서 3/10', state: '진행 중', className: 'in-progress' },
  { title: '구월동 미용실 추천', detail: '구월동에 있는 쁘띠헤어를 추천해주세요.', documents: '문서 7/10', state: '진행 중', className: 'in-progress' },
  { title: '강남 카페 추천', detail: '강남 분위기 좋은 카페를 추천해주세요.', documents: '문서 10/10', state: '완료', className: 'done' },
  { title: '서울 데이트 코스 추천', detail: '서울에서 가볼 만한 데이트 코스를 추천해줘.', documents: '문서 2/10', state: '진행 중', className: 'in-progress' },
  { title: '강남 피부과 추천', detail: '강남에서 평이 좋은 피부과를 추천해줘.', documents: '문서 0/10', state: '대기', className: 'waiting' },
];

function QuestionsAddButton({ onAdd }: { onAdd: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <button className="questions-add" type="button" aria-label="질문 추가" onClick={onAdd}><Plus aria-hidden="true" /></button>,
    document.body,
  );
}

function RegisteredQuestionsScreen({ onBack, onClose, onAdd, onAddDocuments }: { onBack: () => void; onClose: () => void; onAdd: () => void; onAddDocuments: () => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'전체' | '진행 중' | '완료'>('전체');
  const list = registeredQuestions.filter((item) => (filter === '전체' || item.state === filter) && `${item.title} ${item.detail}`.includes(query));
  return <section className="app-screen registered-questions-screen"><SimpleHeader title="GPT 노출 목록" onBack={onBack} onClose={onClose} /><div className="question-search"><Search aria-hidden="true" /><input value={query} placeholder="질문을 검색해 주세요" aria-label="GPT 노출 목록 검색" onChange={(event) => setQuery(event.target.value)} /><button className={`question-search-clear ${query ? 'visible' : ''}`} type="button" aria-label="검색어 지우기" disabled={!query} onClick={() => setQuery('')}><X /></button><span /><button type="button" aria-label="질문 검색"><Search /></button></div><div className="question-tabs" role="tablist" aria-label="질문 상태"><button type="button" className={filter === '전체' ? 'active' : ''} onClick={() => setFilter('전체')}>전체</button><button type="button" className={filter === '진행 중' ? 'active' : ''} onClick={() => setFilter('진행 중')}>진행 중</button><button type="button" className={filter === '완료' ? 'active' : ''} onClick={() => setFilter('완료')}>완료</button></div><div className="registered-question-list">{list.map((item) => <article className="registered-question-card panel" key={item.title}><div className="registered-question-copy"><h2>{item.title}</h2><p>{item.detail}</p><div><span>26.9.15</span><span>{item.documents}</span><em className={`status ${item.className}`}>{item.state}</em></div></div><button className="question-document-add" type="button" aria-label={`${item.title} 문서 추가 구매`} onClick={onAddDocuments}>문서 추가</button></article>)}</div><QuestionsAddButton onAdd={onAdd} /></section>;
}

function PrivacyTermsScreen({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<'privacy' | 'terms'>('terms');
  const terms = tab === 'terms';
  return <section className="app-screen privacy-terms-screen"><SimpleHeader title="개인정보 및 약관" onBack={onBack} onClose={onClose} /><div className="policy-tabs" role="tablist"><button type="button" className={!terms ? 'active' : ''} onClick={() => setTab('privacy')}>개인정보처리방침</button><button type="button" className={terms ? 'active' : ''} onClick={() => setTab('terms')}>이용약관</button></div>{terms ? <div className="policy-copy"><h2>이용약관</h2><h3>서비스 내용</h3><p>GPTBOT은 목표 질문을 기준으로 업체 정보를 분석하고 관련 웹 문서를 작성·등록하며 작업 결과를 관리하는 서비스입니다.</p><hr /><h3>이용 상품</h3><p>{productName}<br />이용 금액 99,000원 · 부가세 포함</p><hr /><h3>작업 진행</h3><p>사전 분석과 결제 후 바로 작업을 시작하고, 진행 내역과 결과를 확인할 수 있습니다.</p><hr /><h3>결과 안내</h3><p>GPT 답변에서의 추천이나 특정 순위의 노출을 보장하지 않습니다.</p></div> : <div className="policy-copy"><h2>개인정보처리방침</h2><h3>수집하는 정보</h3><p>서비스 이용을 위해 가입 메일, 업체 정보, 결제 및 문의 정보를 수집합니다.</p><hr /><h3>이용 목적</h3><p>문서 작업 진행, 결제 기록 관리, 고객 문의 답변을 위해 정보를 이용합니다.</p><hr /><h3>보관 및 문의</h3><p>관련 법령과 운영 정책에 따라 필요한 기간 동안 보관하며, 문의 메뉴에서 정보 관련 요청을 남길 수 있습니다.</p></div>}</section>;
}

const faqItems = [
  ['GPTBOT은 어떤 서비스인가요?', 'GPT 답변에서 업체 정보가 더 잘 이해될 수 있도록 필요한 정보를 정리하고 웹 문서 등록 과정을 관리하는 서비스예요.'],
  ['문서 등록은 어떻게 진행되나요?', '등록할 문서 수와 하루 최대 등록 수를 설정하면, 분석 결과를 바탕으로 필요한 정보를 정리해 순서대로 등록해요.'],
  ['필요한 정보는 어떻게 제출하나요?', '정보 메뉴에서 웹에서 확인되지 않는 가격, 예약 방법, 업체 특징 등을 입력하거나 이미지와 문서를 첨부해 주세요.'],
  ['문서를 추가할 수 있나요?', '등록한 질문 카드의 문서 추가 버튼에서 필요한 문서를 추가할 수 있어요.'],
  ['결제 내역과 영수증은 어디서 확인하나요?', '내 정보에서 결제 기록을 확인하고, 영수증 정보 입력을 통해 발행에 필요한 정보를 등록할 수 있어요.'],
] as const;

function FaqScreen({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  return <section className="app-screen faq-screen"><SimpleHeader title="궁금해요" onBack={onBack} onClose={onClose} /><div className="faq-intro"><h2>자주 묻는<br /><span>질문이에요.</span></h2><p>GPTBOT 이용에 필요한 내용을 빠르게 확인해 보세요.</p></div><div className="faq-list">{faqItems.map(([question, answer]) => <details key={question}><summary><span>{question}</span><ChevronDown aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>;
}

function PasswordChangeSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [changed, setChanged] = useState(false);
  const ready = current && next && next === confirm;
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" showCloseButton={false} className="account-bottom-sheet"><div className="sheet-handle" /><div className="bottom-sheet-header"><SheetTitle>비밀번호 변경</SheetTitle><SheetClose asChild><button className="icon-button" type="button" aria-label="비밀번호 변경 닫기"><X /></button></SheetClose></div><div className="bottom-sheet-form"><PasswordField id="current-password" label="현재 비밀번호" value={current} placeholder="현재 비밀번호를 입력해 주세요" onChange={setCurrent} /><PasswordField id="new-password" label="새 비밀번호" value={next} placeholder="새 비밀번호를 입력해 주세요" onChange={setNext} /><PasswordField id="confirm-password" label="새 비밀번호 확인" value={confirm} placeholder="새 비밀번호를 다시 입력해 주세요" onChange={setConfirm} />{confirm && next !== confirm && <p className="form-error">새 비밀번호가 일치하지 않습니다.</p>}</div><button className="gradient-button account-cta" type="button" disabled={!ready} onClick={() => setChanged(true)}>{changed ? '변경 완료' : '변경하기'}</button>{changed && <p className="sheet-confirmation" role="status">비밀번호를 변경했어요.</p>}</SheetContent></Sheet>;
}

function ReceiptInfoSheet({ open, onOpenChange, method, value, issued, onMethodChange, onValueChange, onIssue }: { open: boolean; onOpenChange: (open: boolean) => void; method: 'business' | 'phone'; value: string; issued: boolean; onMethodChange: (method: 'business' | 'phone') => void; onValueChange: (value: string) => void; onIssue: () => void }) {
  const label = method === 'business' ? '사업자등록번호' : '휴대폰번호';
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" showCloseButton={false} className="account-bottom-sheet"><div className="sheet-handle" /><div className="bottom-sheet-header"><SheetTitle>영수증 정보 입력</SheetTitle><SheetClose asChild><button className="icon-button" type="button" aria-label="영수증 정보 입력 닫기"><X /></button></SheetClose></div><p className="bottom-sheet-copy">영수증을 받을 정보를 선택해 입력해 주세요.</p><div className="receipt-method-tabs" role="tablist"><button type="button" className={method === 'business' ? 'active' : ''} onClick={() => onMethodChange('business')}>사업자</button><button type="button" className={method === 'phone' ? 'active' : ''} onClick={() => onMethodChange('phone')}>휴대폰번호</button></div><label className="account-field receipt-field" htmlFor="receipt-value"><span>{label}</span><input id="receipt-value" type="text" inputMode="numeric" value={value} placeholder={`${label}를 입력해 주세요`} onChange={(event) => onValueChange(event.target.value)} /></label><button className="gradient-button account-cta" type="button" disabled={!value.trim()} onClick={onIssue}>{issued ? '발행 요청 완료' : '발행하기'}</button>{issued && <p className="sheet-confirmation" role="status">입력한 정보로 영수증 발행을 준비했어요.</p>}</SheetContent></Sheet>;
}
