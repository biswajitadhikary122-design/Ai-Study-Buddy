import React, { useState } from 'react';
import type { Quiz, QuizResult, Topic } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { CheckCircleIcon, XCircleIcon } from './icons/FeedbackIcons';

interface QuizUIProps {
  quiz: Quiz;
  topic: Topic;
}

const QuizUI: React.FC<QuizUIProps> = ({ quiz, topic }) => {
  const { t } = useTranslation();
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  const handleStartQuiz = () => {
    setIsStarted(true);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setIsAnswerSubmitted(true);
    if (selectedAnswer === currentQuestion.correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      const finalScore = selectedAnswer === currentQuestion.correctAnswerIndex ? score + 1 : score;
      setIsFinished(true);
      
      const result: QuizResult = {
        id: new Date().toISOString(),
        topicName: topic.name,
        score: finalScore,
        total: totalQuestions,
        timestamp: new Date().toLocaleString(navigator.language, { dateStyle: 'medium', timeStyle: 'short'}),
      };
      
      const history = JSON.parse(localStorage.getItem('quiz-history') || '[]');
      history.unshift(result);
      localStorage.setItem('quiz-history', JSON.stringify(history.slice(0, 20)));
    }
  };

  if (!isStarted) {
    return (
      <div className="mt-4 text-center">
        <button
          onClick={handleStartQuiz}
          aria-label={t('aria_startQuiz', { topic: t(topic.name) })}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold transition-transform duration-200 active:scale-95 hover:scale-105"
        >
          {t('startQuiz')}
        </button>
      </div>
    );
  }
  
  if (isFinished) {
      const finalScore = selectedAnswer === currentQuestion.correctAnswerIndex ? score : score -1;
      return (
          <div className="mt-4 p-4 bg-white/20 dark:bg-black/20 rounded-lg text-center">
              <h4 className="font-bold text-lg">{t('quizTime')}</h4>
              <p className="text-xl mt-2">{t('quizResult', { score, total: totalQuestions })}</p>
          </div>
      );
  }

  return (
    <div className="mt-4 p-4 bg-white/20 dark:bg-black/20 rounded-lg">
        <h4 className="font-bold text-lg">{t('quizTime')} - {currentQuestionIndex + 1}/{totalQuestions}</h4>
        <p className="my-2">{currentQuestion.questionText}</p>
        <div className="space-y-2">
            {currentQuestion.options.map((option, index) => {
                const isCorrect = index === currentQuestion.correctAnswerIndex;
                const isSelected = index === selectedAnswer;
                let buttonClass = 'w-full text-left p-2 rounded-md transition-colors border ';

                if (isAnswerSubmitted) {
                    if (isCorrect) {
                        buttonClass += 'bg-green-500/30 border-green-500';
                    } else if (isSelected && !isCorrect) {
                        buttonClass += 'bg-red-500/30 border-red-500';
                    } else {
                        buttonClass += 'bg-transparent border-gray-500/50 opacity-60';
                    }
                } else {
                    if (isSelected) {
                        buttonClass += 'bg-purple-500/30 border-purple-500';
                    } else {
                        buttonClass += 'bg-transparent border-gray-500/50 hover:bg-purple-500/10';
                    }
                }

                return (
                    <button key={index} onClick={() => !isAnswerSubmitted && setSelectedAnswer(index)} disabled={isAnswerSubmitted} className={buttonClass}>
                        {option}
                    </button>
                )
            })}
        </div>
        
        {isAnswerSubmitted ? (
            <div className="mt-3 text-center">
                 {selectedAnswer !== currentQuestion.correctAnswerIndex ? (
                    <p className="text-sm mb-2 flex items-center justify-center gap-1 text-red-700 dark:text-red-400"><XCircleIcon className="w-4 h-4" /> <span className="font-semibold">{t('incorrect')}</span> {currentQuestion.options[currentQuestion.correctAnswerIndex]}</p>
                 ) : (
                    <p className="text-sm mb-2 flex items-center justify-center gap-1 text-green-700 dark:text-green-400"><CheckCircleIcon className="w-4 h-4" /> <span className="font-semibold">{t('correct')}</span></p>
                 )}
                 <button onClick={handleNext} className="w-full px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold">
                    {currentQuestionIndex < totalQuestions - 1 ? t('nextQuestion') : t('finishQuiz')}
                </button>
            </div>
        ) : (
            <button onClick={handleSubmit} disabled={selectedAnswer === null} className="w-full mt-3 px-4 py-2 rounded-lg bg-purple-500 text-white font-semibold disabled:opacity-50" aria-label={t('aria_submitAnswer')}>
                {t('submitAnswer')}
            </button>
        )}
    </div>
  );
};

export default QuizUI;
