import { useState, useEffect } from "react";

const INITIAL_DEBTS = [
  { id: "mobitto", name: "モビット", category: "消費者金融", balance: 857572, rate: 12, rateType: "年利", monthlyPayment: 20000 },
  { id: "promise", name: "プロミス", category: "消費者金融", balance: 1175712, rate: 15, rateType: "年利", monthlyPayment: 24000 },
  { id: "aiful", name: "アイフル", category: "消費者金融", balance: 478719, rate: 18, rateType: "年利", monthlyPayment: 13000 },
  { id: "acom", name: "アコム", category: "消費者金融", balance: 200000, rate: 18, rateType: "年利", monthlyPayment: 13000 },
  { id: "kurata", name: "倉田さん", category: "個人", balance: 7520000, rate: 0, rateType: "年利", monthlyPayment: 130000 },
  { id: "hinamoto", name: "ヒナモト", category: "個人", balance: 320000, rate: 0, rateType: "年利", monthlyPayment: 40000 },
  { id: "hasegawa", name: "長谷川", category: "個人", balance: 380000, rate: 0, rateType: "年利", monthlyPayment: 20000 },
  { id: "sumida", name: "隅田", category: "個人", balance: 379091, rate: 36, rateType: "年利", monthlyPayment: 80000 },
  { id: "ohno", name: "大野", category: "個人", balance: 70000, rate: 0, rateType: "年利", monthlyPayment: 20000 },
  { id: "tsuchiya", name: "土屋", category: "個人", balance: 260000, rate: 0, rateType: "年利", monthlyPayment: 20000 },
  { id: "shindo", name: "進藤", category: "個人", balance: 260000, rate: 3, rateType: "年利", monthlyPayment: 20000 },
  { id: "fukutani", name: "福谷", category: "個人", balance: 1030000, rate: 0, rateType: "年利", monthlyPayment: 20000 },
  { id: "ebihara", name: "海老原", category: "個人", balance: 390000, rate: 0, rateType: "年利", monthlyPayment: 20000 },
  { id: "soma", name: "相馬", category: "個人", balance: 500000, rate: 0, rateType: "年利", monthlyPayment: 0 },
  { id: "sekine", name: "関根", category: "個人", balance: 300000, rate: 0, rateType: "年利", monthlyPayment: 0 },
  { id: "hatada", name: "畑田", category: "個人", balance: 800000, rate: 0, rateType: "年利", monthlyPayment: 0 },
  { id: "jasso", name: "学生支援機構", category: "その他", balance: null, rate: null, rateType: "年利", monthlyPayment: 19544 },
  { id: "medical", name: "メディカル", category: "その他", balance: 600000, rate: 0, rateType: "年利", monthlyPayment: 27000 },
];

const fmt = (n) => {
  if (n == null) return "不明";
  return n.toLocaleString("ja-JP");
};

const CATEGORY_COLORS = {
  "消費者金融": { bg: "#FEE2E2", text: "#DC2626", border: "#FECACA", accent: "#EF4444" },
  "個人": { bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE", accent: "#3B82F6" },
  "その他": { bg: "#F3E8FF", text: "#7C3AED", border: "#DDD6FE", accent: "#8B5CF6" },
};

const RATE_COLORS = [
  { min: 18, color: "#DC2626" },
  { min: 12, color: "#EA580C" },
  { min: 3, color: "#CA8A04" },
  { min: 0.01, color: "#65A30D" },
  { min: 0, color: "#6B7280" },
];

const getRateColor = (rate) => {
  if (rate == null) return "#6B7280";
  for (const r of RATE_COLORS) {
    if (rate >= r.min) return r.color;
  }
  return "#6B7280";
};

export default function DebtTracker() {
  const [debts, setDebts] = useState(INITIAL_DEBTS);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showHistory, setShowHistory] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await window.storage.get("debt-tracker-data");
      if (result && result.value) {
        const parsed = JSON.parse(result.value);
        if (parsed.debts) setDebts(parsed.debts);
        if (parsed.payments) setPayments(parsed.payments);
      }
    } catch (e) {
      console.log("No saved data, using defaults");
    }
    setLoading(false);
  };

  const saveData = async (newDebts, newPayments) => {
    try {
      await window.storage.set(
        "debt-tracker-data",
        JSON.stringify({ debts: newDebts, payments: newPayments })
      );
    } catch (e) {
      console.error("Save failed:", e);
    }
  };

  const recordPayment = () => {
    if (!selectedDebtId || !paymentAmount) return;
    const amount = parseInt(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const now = new Date();
    const payment = {
      id: Date.now().toString(),
      debtId: selectedDebtId,
      amount,
      note: paymentNote,
      date: now.toISOString(),
    };

    const newDebts = debts.map((d) => {
      if (d.id === selectedDebtId && d.balance != null) {
        return { ...d, balance: Math.max(0, d.balance - amount) };
      }
      return d;
    });

    const newPayments = [payment, ...payments];
    setDebts(newDebts);
    setPayments(newPayments);
    saveData(newDebts, newPayments);

    setShowPaymentModal(false);
    setSelectedDebtId("");
    setPaymentAmount("");
    setPaymentNote("");
  };

  const resetAll = async () => {
    setDebts(INITIAL_DEBTS);
    setPayments([]);
    try {
      await window.storage.delete("debt-tracker-data");
    } catch (e) {}
    setConfirmReset(false);
  };

  const totalDebt = debts.reduce((sum, d) => sum + (d.balance || 0), 0);
  const totalMonthly = debts.reduce((sum, d) => sum + (d.monthlyPayment || 0), 0);
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const originalTotal = INITIAL_DEBTS.reduce((sum, d) => sum + (d.balance || 0), 0);
  const progressPercent = originalTotal > 0 ? Math.min(100, (paidTotal / originalTotal) * 100) : 0;

  const filteredDebts = filterCategory === "all"
    ? debts
    : debts.filter((d) => d.category === filterCategory);

  const sortedDebts = [...filteredDebts].sort((a, b) => (b.rate || 0) - (a.rate || 0));

  const getDebtName = (id) => debts.find((d) => d.id === id)?.name || id;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0F172A", color: "#F1F5F9", fontFamily: "'Noto Sans JP', sans-serif" }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", color: "#F1F5F9", fontFamily: "'Noto Sans JP', sans-serif", padding: "16px", maxWidth: 480, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -1, background: "linear-gradient(135deg, #38BDF8, #818CF8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          返済トラッカー
        </h1>
        <p style={{ fontSize: 11, color: "#64748B", margin: "4px 0 0" }}>田之村 亮汰</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "#1E293B", borderRadius: 12, padding: "14px 12px", border: "1px solid #334155" }}>
          <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, fontWeight: 600 }}>借入残高</p>
          <p style={{ fontSize: 20, fontWeight: 900, margin: "4px 0 0", color: "#F87171" }}>¥{fmt(totalDebt)}</p>
        </div>
        <div style={{ background: "#1E293B", borderRadius: 12, padding: "14px 12px", border: "1px solid #334155" }}>
          <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, fontWeight: 600 }}>返済済み</p>
          <p style={{ fontSize: 20, fontWeight: 900, margin: "4px 0 0", color: "#34D399" }}>¥{fmt(paidTotal)}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ background: "#1E293B", borderRadius: 12, padding: "14px 16px", marginBottom: 16, border: "1px solid #334155" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>返済進捗</span>
          <span style={{ fontSize: 11, color: "#38BDF8", fontWeight: 700 }}>{progressPercent.toFixed(1)}%</span>
        </div>
        <div style={{ background: "#0F172A", borderRadius: 99, height: 10, overflow: "hidden" }}>
          <div style={{
            width: `${progressPercent}%`,
            height: "100%",
            background: "linear-gradient(90deg, #38BDF8, #818CF8)",
            borderRadius: 99,
            transition: "width 0.5s ease",
          }} />
        </div>
        <p style={{ fontSize: 10, color: "#64748B", margin: "6px 0 0", textAlign: "center" }}>
          月の返済合計: ¥{fmt(totalMonthly)}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { key: "overview", label: "一覧" },
          { key: "history", label: "返済履歴" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Noto Sans JP', sans-serif",
              background: activeTab === tab.key ? "linear-gradient(135deg, #38BDF8, #818CF8)" : "#1E293B",
              color: activeTab === tab.key ? "#0F172A" : "#94A3B8",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* Category Filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {["all", "消費者金融", "個人", "その他"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: filterCategory === cat ? "1.5px solid #38BDF8" : "1px solid #334155",
                  background: filterCategory === cat ? "#1E3A5F" : "#1E293B",
                  color: filterCategory === cat ? "#38BDF8" : "#94A3B8",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
              >
                {cat === "all" ? "全て" : cat}
              </button>
            ))}
          </div>

          {/* Debt List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedDebts.map((debt) => {
              const catColor = CATEGORY_COLORS[debt.category] || CATEGORY_COLORS["その他"];
              const completed = debt.balance === 0;
              return (
                <div
                  key={debt.id}
                  style={{
                    background: completed ? "#064E3B" : "#1E293B",
                    borderRadius: 12,
                    padding: "14px",
                    border: completed ? "1px solid #10B981" : "1px solid #334155",
                    opacity: completed ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: completed ? "#34D399" : "#F1F5F9" }}>
                        {completed ? "✅ " : ""}{debt.name}
                      </span>
                      <span style={{
                        fontSize: 9,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: catColor.bg,
                        color: catColor.text,
                        fontWeight: 600,
                      }}>
                        {debt.category}
                      </span>
                    </div>
                    {debt.rate != null && debt.rate > 0 && (
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: getRateColor(debt.rate),
                      }}>
                        {debt.rate}%
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <p style={{ fontSize: 10, color: "#64748B", margin: 0 }}>残高</p>
                      <p style={{ fontSize: 18, fontWeight: 900, margin: "2px 0 0", color: completed ? "#34D399" : "#F1F5F9" }}>
                        {completed ? "完済！" : `¥${fmt(debt.balance)}`}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 10, color: "#64748B", margin: 0 }}>月返済</p>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: "2px 0 0", color: "#94A3B8" }}>
                        {debt.monthlyPayment > 0 ? `¥${fmt(debt.monthlyPayment)}` : "未定"}
                      </p>
                    </div>
                  </div>

                  {!completed && debt.balance != null && (
                    <button
                      onClick={() => {
                        setSelectedDebtId(debt.id);
                        setPaymentAmount(debt.monthlyPayment > 0 ? debt.monthlyPayment.toString() : "");
                        setShowPaymentModal(true);
                      }}
                      style={{
                        width: "100%",
                        marginTop: 10,
                        padding: "8px",
                        borderRadius: 8,
                        border: "1px solid #334155",
                        background: "#0F172A",
                        color: "#38BDF8",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "'Noto Sans JP', sans-serif",
                      }}
                    >
                      返済を記録
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "history" && (
        <div>
          {payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>
              <p style={{ fontSize: 32, margin: 0 }}>📝</p>
              <p style={{ fontSize: 13 }}>まだ返済記録がありません</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {payments.map((p) => {
                const date = new Date(p.date);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
                return (
                  <div key={p.id} style={{ background: "#1E293B", borderRadius: 10, padding: "12px 14px", border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "#F1F5F9" }}>{getDebtName(p.debtId)}</p>
                      <p style={{ fontSize: 10, color: "#64748B", margin: "2px 0 0" }}>
                        {dateStr}{p.note ? ` · ${p.note}` : ""}
                      </p>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 900, color: "#34D399" }}>
                      -¥{fmt(p.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end",
          justifyContent: "center", zIndex: 999,
        }}>
          <div style={{
            background: "#1E293B", borderRadius: "20px 20px 0 0", padding: "24px 20px 32px",
            width: "100%", maxWidth: 480, border: "1px solid #334155",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#F1F5F9" }}>返済を記録</h3>
              <button onClick={() => setShowPaymentModal(false)} style={{
                background: "none", border: "none", color: "#94A3B8", fontSize: 20, cursor: "pointer",
              }}>✕</button>
            </div>

            <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>返済先</label>
            <select
              value={selectedDebtId}
              onChange={(e) => setSelectedDebtId(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #334155",
                background: "#0F172A", color: "#F1F5F9", fontSize: 14, marginBottom: 14,
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              <option value="">選択してください</option>
              {debts.filter(d => d.balance == null || d.balance > 0).map((d) => (
                <option key={d.id} value={d.id}>{d.name}（残高: ¥{fmt(d.balance)}）</option>
              ))}
            </select>

            <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>返済金額（円）</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="例: 20000"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #334155",
                background: "#0F172A", color: "#F1F5F9", fontSize: 16, marginBottom: 14,
                fontFamily: "'Noto Sans JP', sans-serif", boxSizing: "border-box",
              }}
            />

            <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>メモ（任意）</label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="例: 業績給から一括返済"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #334155",
                background: "#0F172A", color: "#F1F5F9", fontSize: 13, marginBottom: 20,
                fontFamily: "'Noto Sans JP', sans-serif", boxSizing: "border-box",
              }}
            />

            <button
              onClick={recordPayment}
              disabled={!selectedDebtId || !paymentAmount}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: selectedDebtId && paymentAmount
                  ? "linear-gradient(135deg, #38BDF8, #818CF8)" : "#334155",
                color: selectedDebtId && paymentAmount ? "#0F172A" : "#64748B",
                fontSize: 15, fontWeight: 900, cursor: "pointer",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              記録する
            </button>
          </div>
        </div>
      )}

      {/* Reset */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} style={{
            background: "none", border: "none", color: "#475569", fontSize: 11, cursor: "pointer",
            fontFamily: "'Noto Sans JP', sans-serif",
          }}>
            データをリセット
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={resetAll} style={{
              padding: "6px 16px", borderRadius: 6, border: "1px solid #DC2626",
              background: "transparent", color: "#DC2626", fontSize: 11, cursor: "pointer",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}>本当にリセット</button>
            <button onClick={() => setConfirmReset(false)} style={{
              padding: "6px 16px", borderRadius: 6, border: "1px solid #334155",
              background: "transparent", color: "#94A3B8", fontSize: 11, cursor: "pointer",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}>キャンセル</button>
          </div>
        )}
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
}
