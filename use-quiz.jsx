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
      // Draw from the WHOLE question pool so each attempt is different —
      // not just the same 5 reshuffled. Start from this level's own
      // questions, then fill/replace from the global pool at random.
      const pool = (window.CHAI_ALL_QUESTIONS || lv.questions).slice();
      const picked = shuffle(pool).slice(0, n);
      // Safety: if pool was somehow too small, top up from the level.
      if (picked.length < n) {
        for (const q of shuffle(lv.questions)) {
          if (picked.length >= n) break;
          if (!picked.includes(q)) picked.push(q);
        }
      }
      return shuffle(picked).map((q) => ({ ...q, options: shuffle(q.options) }));
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
