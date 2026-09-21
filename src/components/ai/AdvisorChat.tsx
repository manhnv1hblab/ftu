'use client';

import React, { FormEvent, useMemo, useState } from 'react';
import { useStudent } from '../../context/StudentContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

const initialMessage: ChatMessage = {
  role: 'assistant',
  content: 'Xin chào! Tôi là trợ lý FTU GoGlobal. Tôi chỉ tư vấn dựa trên dữ liệu S27 đã audit trong hệ thống. Nếu nguồn chưa đủ chắc chắn, tôi sẽ nói rõ “cần xác minh” thay vì tự suy đoán.'
};

function buildClientContext(profile: ReturnType<typeof useStudent>['profile'], currentStep: number, currentPlan: ReturnType<typeof useStudent>['currentPlan'], rankedChoices: ReturnType<typeof useStudent>['rankedChoices']) {
  return {
    currentStep,
    profile: {
      cohort: profile.cohort,
      major: profile.major,
      program: profile.program,
      exchangeSemester: profile.exchangeSemester,
      targetGraduationSemester: profile.targetGraduationSemester,
      gpa4: profile.gpa4,
      gpa10: profile.gpa10,
      completedSemesters: profile.completedSemesters,
      accumulatedCredits: profile.accumulatedCredits,
      hasParticipatedSemesterExchange: profile.hasParticipatedSemesterExchange,
      isFinalSemester: profile.isFinalSemester,
      hasExemplaryStudentAward: profile.hasExemplaryStudentAward,
      hasPassedMidtermInternship: profile.hasPassedMidtermInternship,
      languageCertificate: profile.languageCertificate,
      courses: profile.courses.map(course => ({
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        isTaken: course.isTaken,
        isPassed: course.isPassed
      }))
    },
    currentPlan,
    rankedChoices
  };
}

export const AdvisorChat: React.FC = () => {
  const { profile, currentStep, currentPlan, rankedChoices } = useStudent();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);

  const context = useMemo(
    () => buildClientContext(profile, currentStep, currentPlan, rankedChoices),
    [profile, currentStep, currentPlan, rankedChoices]
  );

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: question };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-10).map(message => ({ role: message.role, content: message.content })),
          context
        })
      });
      const result = await response.json() as { message?: string; sources?: string[]; error?: string };
      if (!response.ok) throw new Error(result.error || 'Không thể nhận câu trả lời từ chatbot.');
      setMessages(previous => [...previous, {
        role: 'assistant',
        content: result.message || 'Chưa nhận được nội dung trả lời.',
        sources: result.sources
      }]);
    } catch (error) {
      setMessages(previous => [...previous, {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Chatbot đang tạm thời không khả dụng.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    'Điều kiện S27 hiện tại là gì?',
    'Hồ sơ của tôi còn thiếu gì?',
    'Trường nào có ít nhất 3 môn tương đương đã duyệt?'
  ];

  return (
    <div className="no-print fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <section className="w-[min(92vw,420px)] h-[min(72vh,620px)] bg-surface-container-lowest border border-surface-container rounded-3xl shadow-2xl overflow-hidden flex flex-col" aria-label="Trợ lý tư vấn AI">
          <header className="bg-primary text-white px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-sm">Trợ lý FTU GoGlobal</h2>
              <p className="text-[11px] text-white/80">Grounded trên dữ liệu S27 đã audit</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/15" aria-label="Đóng chatbot">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </header>

          <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900">
            Chatbot chỉ tư vấn. Kết luận chính thức vẫn cần P.HTQT / bộ môn xác nhận.
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs whitespace-pre-wrap ${message.role === 'user' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface'}`}>
                  {message.content}
                  {message.sources && message.sources.length > 0 && (
                    <details className="mt-2 text-[10px] text-on-surface-variant">
                      <summary className="cursor-pointer font-bold">Nguồn đã truy hồi ({message.sources.length})</summary>
                      <ul className="mt-1 space-y-0.5 list-disc pl-4">
                        {message.sources.slice(0, 8).map(source => <li key={source}>{source}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-xs text-on-surface-variant">Đang đối chiếu dữ liệu S27…</div>}
          </div>

          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
            {quickQuestions.map(question => (
              <button key={question} type="button" onClick={() => setInput(question)} className="shrink-0 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20">
                {question}
              </button>
            ))}
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t border-surface-container flex gap-2">
            <textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              rows={2}
              maxLength={2400}
              placeholder="Hỏi về điều kiện, mapping, trường đối tác…"
              aria-label="Câu hỏi cho trợ lý FTU GoGlobal"
              className="flex-1 resize-none rounded-2xl bg-surface-container-low border border-surface-container px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="self-end w-10 h-10 rounded-full bg-primary text-white disabled:opacity-40" aria-label="Gửi câu hỏi">
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setIsOpen(previous => !previous)} className="w-14 h-14 rounded-full bg-primary text-white shadow-xl hover:bg-primary-container flex items-center justify-center" aria-label={isOpen ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}>
        <span className="material-symbols-outlined text-2xl">{isOpen ? 'close' : 'smart_toy'}</span>
      </button>
    </div>
  );
};
