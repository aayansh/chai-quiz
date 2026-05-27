// Shared quiz state hook — used by all three variations.
(function () {
  const { useState, useCallback, useMemo, useEffect, useRef } = React;

  function useQuiz({ onCorrect, onWrong, onFinish } = {}) {
    const QUIZ = window.CHAI_QUIZ;
    const [stage, setStage] = useState('intro'); // 'intro' | 'q' | 'result'
    const [idx, setIdx] = useState(0);
    const [picked, setPicked] = useState(null); // option index for current q
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState([]); // log of picked indices
    const startTimeRef = useRef(null);
    const [elapsed, setElapsed] = useState(0);

    const begin = useCallback(() => {
      setStage('q'); setIdx(0); setPicked(null); setScore(0); setAnswers([]);
      startTimeRef.current = Date.now(); setElapsed(0);
    }, []);

    const restart = useCallback(() => { setStage('intro'); }, []);

    const pick = useCallback((optIdx) => {
      if (picked !== null) return;
      const q = QUIZ[idx];
      const isCorrect = !!q.options[optIdx].correct;
      setPicked(optIdx);
      setAnswers((a) => [...a, optIdx]);
      if (isCorrect) { setScore((s) => s + 1); onCorrect && onCorrect(); }
      else { onWrong && onWrong(); }
    }, [picked, idx, QUIZ, onCorrect, onWrong]);

    const next = useCallback(() => {
      if (idx + 1 >= QUIZ.length) {
        setElapsed(Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000));
        setStage('result');
        onFinish && onFinish();
      } else {
        setIdx(idx + 1); setPicked(null);
      }
    }, [idx, QUIZ.length, onFinish]);

    const current = QUIZ[idx];
    const isAnswered = picked !== null;
    const isCorrect = isAnswered && !!current.options[picked].correct;
    const result = useMemo(() => window.getChaiResult(score), [score]);
    const progress = (idx + (isAnswered ? 1 : 0)) / QUIZ.length;

    return {
      stage, idx, picked, score, answers, elapsed,
      current, isAnswered, isCorrect, result, progress,
      total: QUIZ.length,
      begin, restart, pick, next,
    };
  }

  window.useQuiz = useQuiz;
})();
