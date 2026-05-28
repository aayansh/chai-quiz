// Shared quiz state hook
// On each begin(), shuffles question order AND option order within each question
// so the same answers don't sit in the same slot every play.
(function () {
  const { useState, useCallback, useMemo, useEffect, useRef } = React;

  // Fisher–Yates
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildShuffledQuiz() {
    const src = window.CHAI_QUIZ || [];
    return shuffle(src).map((q) => ({
      ...q,
      options: shuffle(q.options),
    }));
  }

  function useQuiz({ onCorrect, onWrong, onFinish } = {}) {
    const [stage, setStage] = useState('intro'); // 'intro' | 'q' | 'result'
    const [idx, setIdx] = useState(0);
    const [picked, setPicked] = useState(null);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [quiz, setQuiz] = useState(() => buildShuffledQuiz());
    const startTimeRef = useRef(null);
    const [elapsed, setElapsed] = useState(0);

    const begin = useCallback(() => {
      setQuiz(buildShuffledQuiz());
      setStage('q'); setIdx(0); setPicked(null);
      setScore(0); setAnswers([]);
      startTimeRef.current = Date.now(); setElapsed(0);
    }, []);

    const restart = useCallback(() => { setStage('intro'); }, []);

    const pick = useCallback((optIdx) => {
      if (picked !== null) return;
      const q = quiz[idx];
      const isCorrect = !!q.options[optIdx].correct;
      setPicked(optIdx);
      setAnswers((a) => [...a, optIdx]);
      if (isCorrect) { setScore((s) => s + 1); onCorrect && onCorrect(); }
      else { onWrong && onWrong(); }
    }, [picked, idx, quiz, onCorrect, onWrong]);

    const next = useCallback(() => {
      if (idx + 1 >= quiz.length) {
        setElapsed(Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000));
        setStage('result');
        onFinish && onFinish();
      } else {
        setIdx(idx + 1); setPicked(null);
      }
    }, [idx, quiz.length, onFinish]);

    const current = quiz[idx];
    const isAnswered = picked !== null;
    const isCorrect = isAnswered && !!current.options[picked].correct;
    const result = useMemo(() => window.getChaiResult(score), [score]);
    const progress = (idx + (isAnswered ? 1 : 0)) / quiz.length;

    return {
      stage, idx, picked, score, answers, elapsed,
      current, isAnswered, isCorrect, result, progress,
      total: quiz.length,
      // timerSec/remaining kept on the API as 0/0 so callers don't break
      timerSec: 0, remaining: 0, timedOut: false,
      begin, restart, pick, next,
    };
  }

  window.useQuiz = useQuiz;
})();
