// ════════════════════════════════════════════════════════════════
// CHAI QUIZ v2 — level runner
// useLevelQuiz(level) plays the 5 questions of one level. Question +
// option order are shuffled each attempt.
// ════════════════════════════════════════════════════════════════
(function () {
  const { useState, useCallback, useMemo, useRef } = React;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function useLevelQuiz(level, { onCorrect, onWrong, onFinish } = {}) {
    const [questions, setQuestions] = useState(() => buildQs(level));
    const [idx, setIdx] = useState(0);
    const [picked, setPicked] = useState(null);
    const [correct, setCorrect] = useState(0);
    const startRef = useRef(Date.now());
    const [elapsed, setElapsed] = useState(0);
    const [done, setDone] = useState(false);

    function buildQs(lv) {
      if (!lv) return [];
      const n = lv.questions.length || 5;
      // Level-scoped: a level plays ITS OWN themed questions, so titles,
      // blurbs and the difficulty curve mean something. Randomness comes
      // from shuffling the order AND every question's option positions.
      const picked = shuffle(lv.questions).slice(0, n);
      // Safety net: if a level is ever authored with fewer than n questions,
      // top up from the global pool rather than showing a short level.
      if (picked.length < n) {
        const pool = shuffle((window.CHAI_ALL_QUESTIONS || []).filter((q) => !picked.includes(q)));
        for (const q of pool) {
          if (picked.length >= n) break;
          picked.push(q);
        }
      }
      return picked.map((q) => ({ ...q, options: shuffle(q.options) }));
    }

    const restart = useCallback(() => {
      setQuestions(buildQs(level));
      setIdx(0); setPicked(null); setCorrect(0);
      startRef.current = Date.now(); setElapsed(0); setDone(false);
    }, [level]);

    const pick = useCallback((optIdx) => {
      if (picked !== null) return;
      const q = questions[idx];
      const isRight = !!q.options[optIdx].correct;
      setPicked(optIdx);
      if (isRight) { setCorrect((c) => c + 1); onCorrect && onCorrect(); }
      else { onWrong && onWrong(); }
    }, [picked, idx, questions, onCorrect, onWrong]);

    const next = useCallback(() => {
      if (idx + 1 >= questions.length) {
        const secs = Math.round((Date.now() - startRef.current) / 1000);
        setElapsed(secs); setDone(true);
        onFinish && onFinish({ correct, total: questions.length, elapsed: secs });
      } else {
        setIdx(idx + 1); setPicked(null);
      }
    }, [idx, questions.length, correct, onFinish]);

    const current = questions[idx];
    const isAnswered = picked !== null;
    const isCorrect = isAnswered && !!current.options[picked].correct;
    const progress = (idx + (isAnswered ? 1 : 0)) / (questions.length || 1);
    const stars = window.starsForLevel(correct);

    return {
      questions, idx, picked, correct, elapsed, done,
      current, isAnswered, isCorrect, progress, stars,
      total: questions.length,
      pick, next, restart,
    };
  }

  window.useLevelQuiz = useLevelQuiz;
})();
