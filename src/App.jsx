import React, { useState } from "react";

const ACCENT = "#E8552D";
const INK = "#1A1714";
const PAPER = "#F4EDE0";
const CARD = "#FBF7EF";
const MUTED = "#8A7E6E";
const LINE = "#D8CCB8";
const GREEN = "#3A7D44";

const T = {
  fr: {
    langName: "Français", dir: "ltr",
    kicker: "Atelier de prompt adaptatif",
    titleA: "Le prompt ", titleEm: "sur mesure",
    p_yourReq: "TA DEMANDE", p_analyzing: "CLAUDE ANALYSE…",
    p_questions: "QUESTIONS", p_refining: "CLAUDE AFFINE…",
    p_optimizing: "RÉDACTION…", p_result: "PROMPT OPTIMISÉ",
    introLbl: "Décris ta tâche",
    introSub: "En une phrase ou un paragraphe : que veux-tu que Claude fasse ? Claude te posera ensuite les bonnes questions, adaptées à ta demande.",
    introPh: "ex : écrire un email pour relancer un client qui ne répond plus, sans paraître insistant…",
    analyzing: "Claude étudie ta demande et prépare des questions sur mesure…",
    refining: "Claude vérifie s'il manque un détail clé…",
    optimizing: "Claude rédige ton prompt optimisé…",
    qLbl1: "Questions adaptées", qLbl2: "Dernières précisions",
    qSub: "Réponds à ce qui te parle — tu peux laisser vide.",
    resLbl: "Ton prompt optimisé",
    resSub: (t) => `Conçu spécialement pour : ${t || "ta tâche"}.`,
    enLbl: "Traduction anglaise",
    copy: "Copier", copied: "✓ Copié !", copyEn: "Copier (EN)",
    analyzeBtn: "Analyser avec Claude →", continueBtn: "Continuer ✦",
    generateBtn: "Générer le prompt ✦", restart: "↺ Recommencer",
    edit: "← Modifier", newPrompt: "Nouveau prompt", wait: "Patiente…",
    errEmpty: "Décris d'abord ce que tu veux faire.",
    errAnalyze: "L'analyse a échoué. Réessaie.",
    errOpt: "L'optimisation a échoué. Réessaie.",
  },
  he: {
    langName: "עברית", dir: "rtl",
    kicker: "סדנת פרומפט מותאמת",
    titleA: "הפרומפט ", titleEm: "המותאם אישית",
    p_yourReq: "הבקשה שלך", p_analyzing: "קלוד מנתח…",
    p_questions: "שאלות", p_refining: "קלוד מדייק…",
    p_optimizing: "כתיבה…", p_result: "פרומפט מותאם",
    introLbl: "תאר את המשימה",
    introSub: "במשפט או בפסקה: מה תרצה שקלוד יעשה? לאחר מכן קלוד ישאל אותך את השאלות הנכונות, המותאמות לבקשתך.",
    introPh: "לדוגמה: לכתוב אימייל לתזכורת ללקוח שלא עונה, מבלי להישמע נודניק…",
    analyzing: "קלוד בוחן את בקשתך ומכין שאלות מותאמות אישית…",
    refining: "קלוד בודק אם חסר פרט מהותי…",
    optimizing: "קלוד כותב את הפרומפט המותאם שלך…",
    qLbl1: "שאלות מותאמות", qLbl2: "הבהרות אחרונות",
    qSub: "ענה על מה שרלוונטי לך — אפשר להשאיר ריק.",
    resLbl: "הפרומפט המותאם שלך",
    resSub: (t) => `נבנה במיוחד עבור: ${t || "המשימה שלך"}.`,
    enLbl: "תרגום לאנגלית",
    copy: "העתק", copied: "✓ הועתק!", copyEn: "העתק (אנגלית)",
    analyzeBtn: "← נתח עם קלוד", continueBtn: "✦ המשך",
    generateBtn: "✦ צור פרומפט", restart: "התחל מחדש ↺",
    edit: "ערוך →", newPrompt: "פרומפט חדש", wait: "רגע…",
    errEmpty: "תחילה תאר מה תרצה לעשות.",
    errAnalyze: "הניתוח נכשל. נסה שוב.",
    errOpt: "האופטימיזציה נכשלה. נסה שוב.",
  },
};
const LANG_NAME = { fr: "français", he: "hébreu" };

// Calls our own Vercel serverless proxy (keeps the API key server-side)
async function callClaude(prompt, system) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, system }),
  });
  if (!res.ok) throw new Error("proxy " + res.status);
  const data = await res.json();
  return (data.text || "").trim();
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.search(/[\[{]/);
  const end = Math.max(clean.lastIndexOf("]"), clean.lastIndexOf("}"));
  const slice = start >= 0 && end >= 0 ? clean.slice(start, end + 1) : clean;
  return JSON.parse(slice);
}

export default function App() {
  const [lang, setLang] = useState("fr");
  const t = T[lang];
  const langLabel = LANG_NAME[lang];

  const [phase, setPhase] = useState("intro");
  const [task, setTask] = useState("");
  const [taskType, setTaskType] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [round, setRound] = useState(1);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [finalEN, setFinalEN] = useState("");
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  const pct = { intro: 8, analyzing: 30, questions: 55, refining: 70, optimizing: 88, result: 100 }[phase];
  const setAns = (i, v) => setAnswers((p) => ({ ...p, [`${round}_${i}`]: v }));

  async function analyze() {
    if (!task.trim()) { setError(t.errEmpty); return; }
    setError(""); setPhase("analyzing");
    try {
      const out = await callClaude(
        `Un utilisateur veut créer un prompt pour Claude. Sa tâche :\n"""${task}"""\n\n` +
        `1) Identifie le TYPE de tâche en quelques mots, EN ${langLabel}.\n` +
        `2) Génère 3 à 5 questions SUR MESURE, spécifiques à cette tâche, formulées EN ${langLabel}.\n\n` +
        `Réponds UNIQUEMENT en JSON strict : {"type":"...","questions":[{"q":"...","kind":"text"|"choice","options":["..."],"hint":"..."}]}\n` +
        `"options" seulement si kind="choice". Tous les textes en ${langLabel}.`,
        `Expert mondial en prompt engineering. Questions en ${langLabel}. JSON strict uniquement.`
      );
      const data = parseJSON(out);
      setTaskType(data.type || ""); setQuestions(data.questions || []);
      setAnswers({}); setRound(1); setPhase("questions");
    } catch (e) { setError(t.errAnalyze); setPhase("intro"); }
  }

  async function refine() {
    setError(""); setPhase("refining");
    try {
      const qa = questions.map((q, i) => `Q: ${q.q}\nR: ${answers[`${round}_${i}`] || "(—)"}`).join("\n\n");
      const out = await callClaude(
        `Tâche : """${task}"""\nType : ${taskType}\n\nRéponses :\n${qa}\n\n` +
        `Reste-t-il 1 ou 2 précisions décisives à demander (EN ${langLabel}) ? Sinon liste vide.\n` +
        `JSON strict : {"questions":[{"q":"...","kind":"text"|"choice","options":[...],"hint":"..."}]}`,
        `Expert en prompt engineering. Questions en ${langLabel}. JSON strict. Sois économe.`
      );
      const data = parseJSON(out);
      if (data.questions && data.questions.length) { setQuestions(data.questions); setRound((r) => r + 1); setPhase("questions"); }
      else { optimize(); }
    } catch (e) { optimize(); }
  }

  async function optimize() {
    setError(""); setPhase("optimizing");
    try {
      const qaCurrent = questions.map((q, i) => { const a = answers[`${round}_${i}`]; return a ? `Q: ${q.q}\nR: ${a}` : null; }).filter(Boolean);
      const earlier = Object.entries(answers).filter(([k]) => !k.startsWith(`${round}_`)).map(([, v]) => `R: ${v}`);
      const qa = [...qaCurrent, ...earlier].join("\n\n");
      const out = await callClaude(
        `Tâche initiale : """${task}"""\nType : ${taskType}\n\nPrécisions :\n${qa}\n\n` +
        `Rédige le PROMPT FINAL optimisé pour Claude, parfaitement adapté à cette tâche, clair et structuré.\n` +
        `Fournis-le en DEUX langues : version principale EN ${langLabel}, et traduction fidèle EN ANGLAIS.\n` +
        `Réponds UNIQUEMENT en JSON strict : {"prompt":"<${langLabel}>","prompt_en":"<English>"}`,
        `Expert en prompt engineering. Prompts prêts à l'emploi. JSON strict.`
      );
      const data = parseJSON(out);
      setFinalPrompt((data.prompt || "").trim());
      setFinalEN((data.prompt_en || "").trim());
      setPhase("result");
    } catch (e) { setError(t.errOpt); setPhase("questions"); }
  }

  const copy = (text, tag) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(tag); setTimeout(() => setCopied(""), 1800);
  };
  const reset = () => { setPhase("intro"); setTask(""); setTaskType(""); setQuestions([]); setAnswers({}); setRound(1); setFinalPrompt(""); setFinalEN(""); setError(""); };

  const isRTL = t.dir === "rtl";
  const align = isRTL ? "right" : "left";

  return (
    <div dir={t.dir} style={{ minHeight: "100vh", background: PAPER, color: INK, fontFamily: "Georgia, 'Times New Roman', serif", display: "flex", justifyContent: "center", textAlign: align }}>
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header style={{ padding: "22px 22px 16px", borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, background: ACCENT, borderRadius: "50%" }} />
              <span style={{ fontSize: 11, letterSpacing: isRTL ? 0 : 3, textTransform: "uppercase", color: MUTED }}>{t.kicker}</span>
            </div>
            <div style={{ display: "flex", border: `1.5px solid ${LINE}`, borderRadius: 20, overflow: "hidden" }}>
              {["fr", "he"].map((l) => (
                <button key={l} onClick={() => setLang(l)} style={{ padding: "5px 12px", fontSize: 12, border: "none", cursor: "pointer", fontFamily: "Georgia, serif", background: lang === l ? ACCENT : "transparent", color: lang === l ? "#fff" : MUTED }}>{T[l].langName}</button>
              ))}
            </div>
          </div>
          <h1 style={{ margin: "10px 0 0", fontSize: 29, lineHeight: 1.1, fontWeight: 400, letterSpacing: -0.5 }}>{t.titleA}<em style={{ color: ACCENT, fontStyle: "italic" }}>{t.titleEm}</em></h1>
        </header>

        <div style={{ padding: "14px 22px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MUTED, letterSpacing: 1, marginBottom: 7 }}>
            <span>
              {phase === "intro" && t.p_yourReq}{phase === "analyzing" && t.p_analyzing}
              {phase === "questions" && (taskType ? taskType : t.p_questions)}
              {phase === "refining" && t.p_refining}{phase === "optimizing" && t.p_optimizing}{phase === "result" && t.p_result}
            </span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 3, background: LINE, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: ACCENT, transition: "width .4s ease" }} />
          </div>
        </div>

        <main style={{ flex: 1, padding: "22px", overflowY: "auto" }}>
          {error && <div style={{ background: "#FBE3DB", border: `1px solid ${ACCENT}`, color: "#9A3418", padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>{error}</div>}

          {phase === "intro" && (
            <div style={{ animation: "fade .35s ease" }}>
              <div style={lbl(isRTL)}>{t.introLbl}</div>
              <p style={subP()}>{t.introSub}</p>
              <textarea value={task} onChange={(e) => setTask(e.target.value)} rows={6} placeholder={t.introPh} dir={t.dir} style={inputStyle(align)} />
            </div>
          )}

          {(phase === "analyzing" || phase === "refining" || phase === "optimizing") && (
            <div style={{ textAlign: "center", paddingTop: 64, animation: "fade .35s ease" }}>
              <div style={{ width: 44, height: 44, border: `3px solid ${LINE}`, borderTopColor: ACCENT, borderRadius: "50%", margin: "0 auto 22px", animation: "spin 1s linear infinite" }} />
              <p style={{ color: MUTED, fontStyle: "italic", fontSize: 16 }}>{phase === "analyzing" && t.analyzing}{phase === "refining" && t.refining}{phase === "optimizing" && t.optimizing}</p>
            </div>
          )}

          {phase === "questions" && (
            <div style={{ animation: "fade .35s ease" }}>
              <div style={lbl(isRTL)}>{round === 1 ? t.qLbl1 : t.qLbl2}</div>
              <p style={subP()}>{t.qSub}</p>
              {questions.map((q, i) => (
                <div key={i} style={{ marginBottom: 22 }}>
                  <label style={{ display: "block", fontSize: 15, marginBottom: 8, lineHeight: 1.4 }}>
                    <span style={{ color: ACCENT, margin: isRTL ? "0 0 0 6px" : "0 6px 0 0" }}>{i + 1}.</span>{q.q}
                  </label>
                  {q.kind === "choice" && Array.isArray(q.options) ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {q.options.map((o) => { const active = answers[`${round}_${i}`] === o; return <button key={o} onClick={() => setAns(i, active ? "" : o)} style={chip(active)}>{o}</button>; })}
                    </div>
                  ) : (
                    <textarea value={answers[`${round}_${i}`] || ""} onChange={(e) => setAns(i, e.target.value)} placeholder={q.hint || ""} rows={2} dir={t.dir} style={inputStyle(align)} />
                  )}
                </div>
              ))}
            </div>
          )}

          {phase === "result" && (
            <div style={{ animation: "fade .35s ease" }}>
              <div style={lbl(isRTL)}>{t.resLbl}</div>
              <p style={subP()}>{t.resSub(taskType)}</p>
              <pre dir={t.dir} style={codeBox("36vh", align)}>{finalPrompt}</pre>
              <button onClick={() => copy(finalPrompt, "main")} style={btn(copied === "main" ? GREEN : ACCENT)}>{copied === "main" ? t.copied : t.copy}</button>
              <div style={{ ...lbl(isRTL), marginTop: 26 }}>{t.enLbl}</div>
              <pre dir="ltr" style={{ ...codeBox("30vh", "left"), background: "#2A2520", marginTop: 8 }}>{finalEN}</pre>
              <button onClick={() => copy(finalEN, "en")} style={btn(copied === "en" ? GREEN : INK)}>{copied === "en" ? t.copied : t.copyEn}</button>
            </div>
          )}
        </main>

        <footer style={{ padding: "16px 22px 26px", borderTop: `1px solid ${LINE}`, display: "flex", gap: 12 }}>
          {phase === "intro" && <button onClick={analyze} style={navBtn(false, true)}>{t.analyzeBtn}</button>}
          {phase === "questions" && (<>
            <button onClick={reset} style={navBtn(false, false)}>{t.restart}</button>
            {round === 1 ? <button onClick={refine} style={navBtn(false, true)}>{t.continueBtn}</button> : <button onClick={optimize} style={navBtn(false, true)}>{t.generateBtn}</button>}
          </>)}
          {phase === "result" && (<>
            <button onClick={() => setPhase("questions")} style={navBtn(false, false)}>{t.edit}</button>
            <button onClick={reset} style={navBtn(false, true)}>{t.newPrompt}</button>
          </>)}
          {(phase === "analyzing" || phase === "refining" || phase === "optimizing") && <button disabled style={navBtn(true, true)}>{t.wait}</button>}
        </footer>
      </div>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        @keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea, input { outline: none; }
        textarea:focus, input:focus { border-color: ${ACCENT} !important; }
        ::placeholder { color: ${MUTED}; opacity: .65; }
      `}</style>
    </div>
  );
}

const lbl = (rtl) => ({ fontSize: 12, color: ACCENT, letterSpacing: rtl ? 0 : 2, textTransform: "uppercase", marginBottom: 4 });
const subP = () => ({ margin: "0 0 22px", color: MUTED, fontSize: 15, fontStyle: "italic", lineHeight: 1.5 });
function inputStyle(align) { return { width: "100%", boxSizing: "border-box", padding: "12px 14px", border: `1.5px solid ${LINE}`, borderRadius: 10, background: CARD, fontSize: 16, color: INK, fontFamily: "Georgia, serif", resize: "vertical", transition: "border-color .15s", textAlign: align }; }
function chip(active) { return { padding: "9px 14px", borderRadius: 22, fontSize: 13, border: `1.5px solid ${active ? ACCENT : LINE}`, background: active ? ACCENT : "transparent", color: active ? "#fff" : INK, cursor: "pointer", fontFamily: "Georgia, serif", transition: "all .15s" }; }
function codeBox(maxH, align) { return { whiteSpace: "pre-wrap", wordBreak: "break-word", background: INK, color: "#F4EDE0", padding: 18, borderRadius: 12, fontSize: 12.5, lineHeight: 1.6, fontFamily: "'Courier New', monospace", margin: 0, maxHeight: maxH, overflowY: "auto", textAlign: align }; }
function btn(bg) { return { marginTop: 12, width: "100%", padding: 14, borderRadius: 12, border: "none", background: bg, color: "#fff", fontSize: 15, fontFamily: "Georgia, serif", cursor: "pointer" }; }
function navBtn(disabled, primary) { return { flex: 1, padding: 14, borderRadius: 12, fontSize: 14, cursor: disabled ? "default" : "pointer", fontFamily: "Georgia, serif", letterSpacing: 0.3, border: primary ? "none" : `1.5px solid ${LINE}`, background: primary ? INK : "transparent", color: primary ? "#fff" : (disabled ? "#C4B9A8" : INK), opacity: disabled ? 0.5 : 1 }; }
