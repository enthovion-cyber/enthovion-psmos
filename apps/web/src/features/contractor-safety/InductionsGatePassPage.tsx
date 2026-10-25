// apps/web/src/features/contractor-safety/InductionsGatePassPage.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Award,
  Users,
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Scan,
  Clock,
  Building2,
  Flame,
  Check,
  X,
  Printer,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import {
  ContractorSafetyHeader,
  CsmInductionStatusBadge,
  CsmPassStatusBadge,
  CsmTradeBadge
} from './ContractorSafetyUi';
import {
  useContractorWorkers,
  useCreateInductionCourse,
  useGatePasses,
  useInductionCourses,
  useIssueGatePass,
  useScanGatePass,
  useSubmitInductionQuiz
} from './hooks/useContractorSafety';
import type {
  CsmGateScanResult,
  CsmInductionCourse,
  CsmInductionTargetAudience
} from './types/contractor-safety.types';

export function InductionsGatePassPage() {
  const [activeTab, setActiveTab] = useState<'courses' | 'player' | 'passes' | 'scanner'>('courses');

  // Interactive Player State
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [hazardSigned, setHazardSigned] = useState<boolean>(false);
  const [signatureName, setSignatureName] = useState<string>('');
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);

  // Scanner Terminal State
  const [scanPassCode, setScanPassCode] = useState<string>('GP-APX-01');
  const [scanGateLocation, setScanGateLocation] = useState<string>('MAIN_GATE_TURNSTILE_1');
  const [lastScanResult, setLastScanResult] = useState<CsmGateScanResult | null>(null);

  // New Course Modal State
  const [isNewCourseOpen, setIsNewCourseOpen] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseAudience, setNewCourseAudience] = useState<CsmInductionTargetAudience>('ALL_CONTRACTORS');
  const [newCoursePassingScore, setNewCoursePassingScore] = useState(80);
  const [newCourseValidityDays, setNewCourseValidityDays] = useState(365);

  // Queries & Mutations
  const { data: courses = [], isLoading: isCoursesLoading } = useInductionCourses();
  const { data: workersData } = useContractorWorkers();
  const { data: gatePasses = [], isLoading: isPassesLoading } = useGatePasses();

  const createCourseMutation = useCreateInductionCourse();
  const submitQuizMutation = useSubmitInductionQuiz();
  const scanPassMutation = useScanGatePass();
  const issuePassMutation = useIssueGatePass();

  const workers = workersData?.workers ?? [];
  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const activeWorker = workers.find((w) => w.id === selectedWorkerId);

  const activePassesCount = gatePasses.filter((p) => p.effective_status === 'ACTIVE').length;
  const totalSlides = activeCourse?.slides_content?.length ?? 0;
  const questions = activeCourse?.quiz_questions ?? [];

  const handleStartExamForWorker = (courseId: string, workerId?: string) => {
    setSelectedCourseId(courseId);
    if (workerId) {
      setSelectedWorkerId(workerId);
    } else if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0]?.id || '');
    }
    setCurrentSlideIndex(0);
    setQuizAnswers(new Array(questions.length).fill(-1));
    setHazardSigned(false);
    setExamSubmitted(false);
    setActiveTab('player');
  };

  const handleAnswerSelect = (qIdx: number, optIdx: number) => {
    const updated = [...quizAnswers];
    updated[qIdx] = optIdx;
    setQuizAnswers(updated);
  };

  const handleSubmitQuiz = async () => {
    if (!activeWorker || !activeCourse || !signatureName) return;

    await submitQuizMutation.mutateAsync({
      workerId: activeWorker.id,
      courseId: activeCourse.id,
      data: {
        answers: quizAnswers,
        hazard_acknowledgment_signed: hazardSigned,
        signature_name: signatureName
      }
    });

    setExamSubmitted(true);
  };

  const handleScanPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanPassCode) return;

    const res = await scanPassMutation.mutateAsync({
      pass_code: scanPassCode.trim(),
      gate_location: scanGateLocation
    });

    setLastScanResult(res);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode || !newCourseTitle) return;

    await createCourseMutation.mutateAsync({
      course_code: newCourseCode.toUpperCase(),
      title: newCourseTitle,
      description: newCourseDesc || undefined,
      target_audience: newCourseAudience,
      passing_score_percent: newCoursePassingScore,
      validity_period_days: newCourseValidityDays,
      slides_content: [
        {
          title: 'Facility Chemical Hazards Overview',
          content: 'This plant handles toxic, flammable, and reactive chemicals governed under OSHA 29 CFR 1910.119.',
          key_points: ['Review Safety Data Sheets (SDS)', 'Know unit wind socks and muster points']
        }
      ],
      quiz_questions: [
        {
          question: 'What is the required reaction when hearing the continuous evacuation warble siren?',
          options: ['Evacuate upwind/crosswind to designated muster station', 'Remain inside tent', 'Continue job'],
          correct_index: 0,
          explanation: 'Evacuate immediately in crosswind/upwind directions to avoid toxic gas dispersion.'
        }
      ]
    });

    setIsNewCourseOpen(false);
    setNewCourseCode('');
    setNewCourseTitle('');
    setNewCourseDesc('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 transition-colors">
      <ContractorSafetyHeader
        title="Site Inductions &amp; QR Gate Pass Access"
        subtitle="Unit-specific process hazard orientations, OSHA 1910.119(h)(3)(iii) comprehension quizzes, digital hazard acknowledgments, and real-time security gate QR badges."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewCourseOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Induction Course</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Published Courses</span>
              <GraduationCap className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{courses.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">General &amp; unit-specific PSM briefings</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Active Gate Passes</span>
              <QrCode className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activePassesCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Authorized for plant turnstiles</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Workers Roster</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{workers.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registered trade personnel</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
              <span>Turnstile Gating</span>
              <Scan className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">100% Guarded</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Live credential verification at gate</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6 pb-2">
          <button
            onClick={() => setActiveTab('courses')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'courses'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Induction Courses ({courses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('player')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'player'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Orientation Player &amp; Exam</span>
          </button>

          <button
            onClick={() => setActiveTab('passes')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'passes'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Digital QR Gate Passes ({gatePasses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'scanner'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>Security Turnstile Scanner</span>
          </button>
        </div>

        {/* TAB 1: INDUCTION COURSES CATALOG */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                  Mandatory OSHA 29 CFR 1910.119(h)(2)(ii) Process Hazard Orientation
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                  Contract employers must assure that each contract employee is informed of known potential fire, explosion, or toxic release hazards and emergency action plans prior to entry on PSM covered units.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {isCoursesLoading ? (
                <div className="col-span-full py-12 text-center text-slate-400">Loading courses...</div>
              ) : (
                courses.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {c.course_code}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {c.target_audience.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1.5">{c.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">{c.description}</p>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800 mb-4">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Pass Threshold</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{c.passing_score_percent}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Validity</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{c.validity_period_days} Days</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Orientation Slides</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {c.total_slides ?? c.slides_content?.length ?? 0} Slides
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Quiz Questions</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {c.total_questions ?? c.quiz_questions?.length ?? 0} Items
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartExamForWorker(c.id)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Take / Administer Induction</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE INDUCTION PLAYER & QUIZ */}
        {activeTab === 'player' && activeCourse && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Worker Selector & Course Outline */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Examinee Candidate</h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Contract Worker
                  </label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    <option value="">Select worker...</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.first_name} {w.last_name} ({w.worker_code} - {w.craft_trade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Selected Course
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setCurrentSlideIndex(0);
                      setExamSubmitted(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_code}: {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Course Outline</h4>
                <div className="space-y-1.5 text-xs">
                  {activeCourse.slides_content?.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        currentSlideIndex === idx
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">
                        {idx + 1}. {s.title}
                      </span>
                      {currentSlideIndex > idx && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentSlideIndex(totalSlides)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      currentSlideIndex === totalSlides
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Final Comprehension Exam</span>
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Slide Viewer or Exam Form */}
            <div className="lg:col-span-2">
              {currentSlideIndex < totalSlides ? (
                // SLIDE VIEWER
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[460px]">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                      <span>
                        Slide {currentSlideIndex + 1} of {totalSlides}
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
                        {activeCourse.course_code}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                      {activeCourse.slides_content?.[currentSlideIndex]?.title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                      {activeCourse.slides_content?.[currentSlideIndex]?.content}
                    </p>

                    {activeCourse.slides_content?.[currentSlideIndex]?.key_points && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                          Mandatory Safety Practices
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          {activeCourse.slides_content[currentSlideIndex].key_points?.map((pt, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <button
                      onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                      disabled={currentSlideIndex === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous Slide</span>
                    </button>

                    <button
                      onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      <span>
                        {currentSlideIndex === totalSlides - 1 ? 'Proceed to Final Exam' : 'Next Slide'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                // COMPREHENSION EXAM & LEGAL HAZARD SIGN-OFF
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      OSHA 1910.119(h)(3)(iii) COMPREHENSION VERIFICATION
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      Final Comprehension Examination
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Passing score: <span className="font-bold">{activeCourse.passing_score_percent}%</span>. You must answer all questions and provide a digital e-signature acknowledging chemical hazards.
                    </p>
                  </div>

                  {!activeWorker ? (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200">
                      Please select a contract worker from the left panel to submit this exam.
                    </div>
                  ) : null}

                  {/* Exam Questions */}
                  <div className="space-y-5">
                    {questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                      >
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {qIdx + 1}. {q.question}
                        </h4>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = quizAnswers[qIdx] === optIdx;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleAnswerSelect(qIdx, optIdx)}
                                className={`w-full text-left p-3 rounded-lg text-xs font-medium transition-colors border flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                              >
                                <span>{opt}</span>
                                {isSelected && <Check className="w-4 h-4 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* OSHA 1910.119(h) Digital Signature Form */}
                  <div className="p-5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-4 text-xs">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="hazardAck"
                        checked={hazardSigned}
                        onChange={(e) => setHazardSigned(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                      />
                      <label htmlFor="hazardAck" className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        I hereby attest and acknowledge that I have received, reviewed, and understood the chemical hazards, emergency siren signals, evacuation routes, and provisions of the facility Emergency Action Plan under OSHA 29 CFR 1910.119(h).
                      </label>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contract Worker Legal E-Signature (Full Name) *
                      </label>
                      <input
                        type="text"
                        placeholder="Type full legal name..."
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  {/* Exam Result Display if submitted */}
                  {submitQuizMutation.data && (
                    <div
                      className={`p-5 rounded-xl border flex items-start gap-3 ${
                        submitQuizMutation.data.passed
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {submitQuizMutation.data.passed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {submitQuizMutation.data.passed
                            ? `EXAM PASSED (${submitQuizMutation.data.score_percent}%) — DIGITAL GATE PASS ISSUED`
                            : `EXAM FAILED (${submitQuizMutation.data.score_percent}%) — PASS THRESHOLD ${activeCourse.passing_score_percent}%`}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          Correct answers: {submitQuizMutation.data.correct_answers} of {submitQuizMutation.data.total_questions}.
                          {submitQuizMutation.data.passed
                            ? ' Digital QR Gate Pass has been registered and cleared for gate security.'
                            : ' Review course materials and retake the comprehension verification.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCurrentSlideIndex(0)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700"
                    >
                      Back to Slides
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      disabled={!hazardSigned || !signatureName || !activeWorker || submitQuizMutation.isPending}
                      className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-colors"
                    >
                      {submitQuizMutation.isPending ? 'Grading & Signing...' : 'Submit Exam & Generate Gate Pass'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DIGITAL QR GATE PASSES & BADGES */}
        {activeTab === 'passes' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Security Turnstile Gate Passes ({gatePasses.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time scannable QR passes linked to verified OSHA 1910.119(h) training dossiers and badge credentials.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isPassesLoading ? (
                <div className="col-span-full py-12 text-center text-slate-400">Loading gate passes...</div>
              ) : gatePasses.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                  No gate passes issued yet. Workers receive gate passes automatically upon passing site inductions.
                </div>
              ) : (
                gatePasses.map((p) => {
                  const w = p.worker;
                  const employer = w?.contractor;

                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between"
                    >
                      {/* Security Header Banner */}
                      <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
                        <div>
                          <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                            PSM SECURITY GATE PASS
                          </div>
                          <div className="font-bold text-base font-mono tracking-tight text-blue-400">
                            {p.pass_code}
                          </div>
                        </div>
                        <CsmPassStatusBadge status={p.effective_status ?? p.status} />
                      </div>

                      {/* Badge Body */}
                      <div className="p-5 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-lg flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                            {w?.first_name?.[0]}
                            {w?.last_name?.[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                              {w?.first_name} {w?.last_name}
                            </h4>
                            <div className="text-xs text-slate-500 font-mono">{w?.worker_code}</div>
                            <div className="mt-1">
                              {w?.craft_trade && <CsmTradeBadge trade={w.craft_trade} />}
                            </div>
                          </div>
                        </div>

                        {/* Employer & Units */}
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                          <div className="text-slate-500">
                            Employer:{' '}
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {employer?.company_name ?? 'Contractor'}
                            </span>
                          </div>
                          <div className="text-slate-500">
                            Authorized Units:{' '}
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {Array.isArray(p.authorized_units) ? p.authorized_units.join(', ') : 'ALL'}
                            </span>
                          </div>
                          <div className="text-slate-500">
                            Expires:{' '}
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {p.valid_until ? p.valid_until.slice(0, 10) : '—'}
                            </span>
                          </div>
                        </div>

                        {/* QR Code Visual Simulation */}
                        <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                          <div className="flex flex-col items-center gap-1.5">
                            <QrCode className="w-20 h-20 text-slate-800 dark:text-slate-200" />
                            <span className="text-[10px] font-mono text-slate-400">Scannable Gate Barcode</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <button
                          onClick={() => {
                            setScanPassCode(p.pass_code);
                            setActiveTab('scanner');
                          }}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Scan className="w-3.5 h-3.5" />
                          <span>Test in Scanner</span>
                        </button>
                        <span className="text-slate-400 text-[11px]">
                          Last scan: {p.last_scanned_at ? p.last_scanned_at.slice(0, 10) : 'Never'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: LIVE TURNSTILE SCANNER TERMINAL */}
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Scanner Terminal Form */}
            <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Gate Access Terminal</h3>
              </div>
              <p className="text-xs text-slate-500">
                Simulates real-time turnstile badge tap or security optical reader at refinery entry points.
              </p>

              <form onSubmit={handleScanPass} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gate / Turnstile Location
                  </label>
                  <select
                    value={scanGateLocation}
                    onChange={(e) => setScanGateLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="MAIN_GATE_TURNSTILE_1">Main Plant Gate — Turnstile 1</option>
                    <option value="NORTH_TURNSTILE_2">North Contractors Gate — Turnstile 2</option>
                    <option value="HF_ALKY_UNIT_PORTAL">HF Alky Unit Security Entry Portal</option>
                    <option value="DOCK_MARINE_GATE">Marine Terminal Access Gate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    QR Gate Pass Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={scanPassCode}
                    onChange={(e) => setScanPassCode(e.target.value)}
                    placeholder="e.g. GP-APX-01"
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-400">Quick test:</span>
                    {gatePasses.slice(0, 3).map((gp) => (
                      <button
                        key={gp.id}
                        type="button"
                        onClick={() => setScanPassCode(gp.pass_code)}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      >
                        {gp.pass_code}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={scanPassMutation.isPending}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Scan className="w-4 h-4" />
                  <span>{scanPassMutation.isPending ? 'Validating...' : 'Scan Pass / Verify Access'}</span>
                </button>
              </form>
            </div>

            {/* Right Screen: Access Verification Monitor */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Access Verification Screen
                </h3>

                {!lastScanResult ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                    <Scan className="w-12 h-12 stroke-[1.5] mb-2 opacity-40" />
                    <p className="text-sm">Scan a pass code on the left to verify turnstile access.</p>
                  </div>
                ) : lastScanResult.access_granted ? (
                  <div className="space-y-4">
                    {/* Access Granted Screen */}
                    <div className="p-6 rounded-2xl bg-emerald-500 text-white shadow-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                          <div>
                            <span className="text-xs uppercase tracking-widest text-emerald-100 font-bold">
                              GATE ACCESS GRANTED
                            </span>
                            <h2 className="text-2xl font-bold tracking-tight">TURNSTILE UNLOCKED</h2>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/20 text-white font-bold">
                          {lastScanResult.gate_pass?.scanned_gate}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100">
                        {lastScanResult.message} • All OSHA 1910.119(h) orientation briefings and mandatory trade qualifications verified.
                      </p>
                    </div>

                    {/* Personnel Clearance Dossier */}
                    {lastScanResult.worker && (
                      <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {lastScanResult.worker.name}
                            </h4>
                            <span className="text-slate-500 font-mono">{lastScanResult.worker.worker_code}</span>
                          </div>
                          <CsmTradeBadge trade={lastScanResult.worker.craft_trade} />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          <div>Employer: <span className="font-semibold text-slate-800 dark:text-slate-100">{lastScanResult.worker.contractor}</span></div>
                          <div>Badge #: <span className="font-mono">{lastScanResult.worker.badge_number ?? '—'}</span></div>
                          <div>Safety Grade: <span className="font-bold text-emerald-600">{lastScanResult.worker.safety_grade}</span></div>
                          <div>Valid Until: <span className="font-mono">{lastScanResult.gate_pass?.valid_until.slice(0, 10)}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Access Denied Screen */}
                    <div className="p-6 rounded-2xl bg-rose-600 text-white shadow-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-8 h-8 text-white" />
                          <div>
                            <span className="text-xs uppercase tracking-widest text-rose-200 font-bold">
                              ACCESS PROHIBITED
                            </span>
                            <h2 className="text-2xl font-bold tracking-tight">TURNSTILE LOCKED</h2>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/20 text-white font-bold">
                          SECURITY ALERT
                        </span>
                      </div>
                      <p className="text-xs text-rose-100 font-medium">
                        {lastScanResult.message}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs space-y-1 text-rose-900 dark:text-rose-200">
                      <span className="font-bold block">Protocol Action Required:</span>
                      <p>
                        Instruct contract employee to report to Plant Safety Center (Bldg 104) to complete required safety induction or resolve expired credentials before unit entry.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE COURSE MODAL */}
      {isNewCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Create Induction Orientation Course
                </h3>
              </div>
              <button
                onClick={() => setIsNewCourseOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IND-CHLORINE-04"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={newCourseAudience}
                    onChange={(e) => setNewCourseAudience(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="ALL_CONTRACTORS">All Contractors</option>
                    <option value="TIER_1_ONLY">Tier 1 Contractors Only</option>
                    <option value="UNIT_SPECIFIC">Unit-Specific Process</option>
                    <option value="TURNAROUND_SPECIAL">Turnaround Special</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anhydrous Chlorine Railcar Offloading Safety"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description &amp; Chemical Hazards
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of process hazards, PPE, and siren responses..."
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Passing Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newCoursePassingScore}
                    onChange={(e) => setNewCoursePassingScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={730}
                    value={newCourseValidityDays}
                    onChange={(e) => setNewCourseValidityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCourseOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  {createCourseMutation.isPending ? 'Saving...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
