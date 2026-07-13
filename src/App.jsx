import React, { useState, useEffect } from "react";
import {
  ShoppingBag, X, Plus, Minus, ChefHat, ArrowLeft,
  Settings, Trash2, Check, Copy, Loader2,
  MessageCircle, Send, Mail, Phone, Lock, Link2, Camera, Image as ImageIcon
} from "lucide-react";

const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'Karla', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const SUPABASE_URL = "https://vwablvcwbdjjisfsvjfn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3YWJsdmN3YmRqamlzZnN2amZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NTAwMDQsImV4cCI6MjA5OTEyNjAwNH0.8yCoBF9sbJvj64uqCldlddCME_780VvfpAamDYdj0hc";
const STORAGE_BUCKET = "products";

const PIN_KEY = "petitchef_admin_pin";
const DEFAULT_PIN = "1234";
const EMOJIS = ["🧑‍🍳","🧸","🃏","👨‍🍳","📖","🥄","🍳","🧁","🍰","🥐","🍕","🍩","🧂","🥕"];
const BUTTON_EMOJIS = ["📸","🌐","⭐","💬","🎥","📍","🛍️","✨"];
const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;

const DEFAULT_STATE = {
  shopName: "Petit Chef",
  tagline: "La boutique du mini cuisinier",
  products: [
    { id: 1, num: "01", name: "Tablier Petit Chef", desc: "Coton épais, poche frontale, taille unique.", price: 19.9, color: "#D9A441", emoji: "🧑‍🍳", image: "", variants: [] },
    { id: 2, num: "02", name: "Peluche Chef Câlin", desc: "30cm, toque brodée, lavable en machine.", price: 24.5, color: "#7A8B69", emoji: "🧸", image: "", variants: [] },
    { id: 3, num: "03", name: "Cartes Recettes", desc: "Lot de 12, recettes faciles en famille.", price: 14.0, color: "#B65C4A", emoji: "🃏", image: "", variants: [] },
    { id: 4, num: "04", name: "Toque de Chef", desc: "Ajustable, broderie prénom en option.", price: 12.9, color: "#3D2145", emoji: "👨‍🍳", image: "", variants: [] },
  ],
  contact: { type: "whatsapp", value: "", label: "Une question ?" },
  customButtons: [],
};

async function loadState() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/shop_state?id=eq.1&select=data`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const json = await res.json();
    const remote = json?.[0]?.data;
    if (remote && Object.keys(remote).length) {
      return { ...DEFAULT_STATE, ...remote, products: (remote.products || []).map(p => ({ variants: [], ...p })) };
    }
  } catch (e) { console.error("Supabase load error", e); }
  return DEFAULT_STATE;
}
async function saveState(state) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/shop_state?id=eq.1`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ data: state }),
    });
  } catch (e) { console.error("Supabase save error", e); }
}

async function uploadMedia(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) throw new Error("Échec de l'upload");
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

function loadPin() {
  try { return localStorage.getItem(PIN_KEY) || DEFAULT_PIN; } catch (e) { return DEFAULT_PIN; }
}
function savePin(pin) {
  try { localStorage.setItem(PIN_KEY, pin); } catch (e) {}
}
function contactHref(contact) {
  if (!contact.value) return null;
  switch (contact.type) {
    case "whatsapp": return `https://wa.me/${contact.value.replace(/[^\d]/g, "")}`;
    case "telegram": return `https://t.me/${contact.value.replace("@", "")}`;
    case "email": return `mailto:${contact.value}`;
    case "tel": return `tel:${contact.value.replace(/[^\d+]/g, "")}`;
    default: return null;
  }
}
function contactIcon(type) {
  if (type === "whatsapp") return MessageCircle;
  if (type === "telegram") return Send;
  if (type === "email") return Mail;
  return Phone;
}

function useTelegram() {
  const [tg] = useState(() => {
    try {
      const t = window.Telegram?.WebApp;
      if (t) { t.ready(); t.expand(); return t; }
    } catch (e) {}
    return null;
  });
  const haptic = (type = "light") => {
    try { tg?.HapticFeedback?.impactOccurred(type); } catch (e) {}
  };
  return { tg, haptic, inTelegram: !!tg };
}

function PriceTag({ price, prefix }) {
  return <span style={{ fontFamily: FONT_MONO }} className="text-sm">{prefix}{price.toFixed(2)}&nbsp;€</span>;
}

function Media({ src, emoji, className }) {
  if (!src) return <span>{emoji}</span>;
  if (VIDEO_EXT.test(src)) {
    return <video src={src} className={className} autoPlay muted loop playsInline />;
  }
  return <img src={src} className={className} />;
}

function displayPrice(product) {
  if (product.variants && product.variants.length > 0) {
    return Math.min(...product.variants.map((v) => v.price));
  }
  return product.price;
}

function ProductCard({ product, onOpen }) {
  const hasVariants = product.variants && product.variants.length > 0;
  return (
    <button onClick={() => onOpen(product)}
      className="text-left bg-[#FFFEFB] rounded-2xl overflow-hidden border border-[#EADFC7] active:scale-[0.98] transition-transform">
      <div className="h-28 flex items-center justify-center text-5xl relative overflow-hidden" style={{ backgroundColor: product.color + "22" }}>
        <Media src={product.image} emoji={product.emoji} className="w-full h-full object-cover" />
        <span style={{ fontFamily: FONT_MONO, color: product.color }}
          className="absolute top-2 left-2 text-[11px] font-semibold bg-white/80 rounded-full px-2 py-0.5">
          Plat №{product.num}
        </span>
      </div>
      <div className="p-3">
        <h3 style={{ fontFamily: FONT_DISPLAY }} className="text-[#2B2320] text-[15px] leading-tight font-semibold">{product.name}</h3>
        <p className="text-[#8A7F6E] text-xs mt-1 leading-snug line-clamp-2">{product.desc}</p>
        <div className="mt-2 flex items-center justify-between">
          <PriceTag price={displayPrice(product)} prefix={hasVariants ? "dès " : ""} />
          <span className="text-xs font-semibold rounded-full px-2 py-1" style={{ backgroundColor: product.color, color: "#FFFEFB", fontFamily: FONT_BODY }}>+ Ajouter</span>
        </div>
      </div>
    </button>
  );
}

function ProductSheet({ product, onClose, onAdd, haptic }) {
  const [qty, setQty] = useState(1);
  const [variantIdx, setVariantIdx] = useState(0);
  useEffect(() => { setQty(1); setVariantIdx(0); }, [product]);
  if (!product) return null;
  const hasVariants = product.variants && product.variants.length > 0;
  const unitPrice = hasVariants ? product.variants[variantIdx].price : product.price;
  const variant = hasVariants ? product.variants[variantIdx] : null;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-[#2B2320]/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#FBF3E7] rounded-t-3xl p-5 pb-6 animate-[slideUp_0.25s_ease-out]">
        <div className="flex justify-between items-start mb-3">
          <span style={{ fontFamily: FONT_MONO, color: product.color }} className="text-xs font-semibold">Plat №{product.num}</span>
          <button onClick={onClose} className="text-[#8A7F6E]"><X size={20} /></button>
        </div>
        <div className="h-32 rounded-2xl flex items-center justify-center text-6xl mb-3 overflow-hidden" style={{ backgroundColor: product.color + "22" }}>
          <Media src={product.image} emoji={product.emoji} className="w-full h-full object-cover" />
        </div>
        <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-[#2B2320] text-xl font-semibold">{product.name}</h2>
        <p className="text-[#8A7F6E] text-sm mt-1">{product.desc}</p>

        {hasVariants && (
          <div className="flex flex-wrap gap-2 mt-3">
            {product.variants.map((v, i) => (
              <button key={i} onClick={() => setVariantIdx(i)}
                style={{ fontFamily: FONT_MONO }}
                className={`rounded-xl px-3 py-2 text-xs font-semibold border ${variantIdx === i ? "bg-[#3D2145] text-white border-[#3D2145]" : "bg-white text-[#2B2320] border-[#EADFC7]"}`}>
                {v.label} · {v.price.toFixed(2)}€
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center gap-3 bg-white rounded-full px-3 py-2 border border-[#EADFC7]">
            <button onClick={() => { setQty(q => Math.max(1, q - 1)); haptic(); }}><Minus size={16} /></button>
            <span style={{ fontFamily: FONT_MONO }} className="w-4 text-center">{qty}</span>
            <button onClick={() => { setQty(q => q + 1); haptic(); }}><Plus size={16} /></button>
          </div>
          <PriceTag price={unitPrice * qty} prefix="" />
        </div>
        <button onClick={() => { onAdd(product, qty, variant); haptic("medium"); onClose(); }}
          style={{ backgroundColor: product.color, fontFamily: FONT_BODY }}
          className="w-full mt-5 text-[#FFFEFB] font-semibold rounded-full py-3 text-sm">
          Ajouter au panier
        </button>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
    </div>
  );
}

function CryptoCheckout({ total, onClose, onPaid }) {
  const [coin, setCoin] = useState("USDT");
  const [status, setStatus] = useState("idle");
  const rates = { USDT: 1, TON: 5.8, BTC: 62000 };
  const amount = (total / rates[coin]).toFixed(coin === "BTC" ? 6 : 4);
  const address = { USDT: "TXn9...4kLp (TRC20)", TON: "UQAb...9xQz", BTC: "bc1q...ml3e" }[coin];

  const handleConfirm = () => {
    setStatus("waiting");
    setTimeout(() => { setStatus("paid"); onPaid(); }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FBF3E7] flex flex-col max-w-sm mx-auto">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#EADFC7]">
        <button onClick={onClose}><ArrowLeft size={20} className="text-[#2B2320]" /></button>
        <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-lg font-semibold text-[#2B2320]">Paiement crypto</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {status !== "paid" ? (
          <>
            <p className="text-[#8A7F6E] text-xs mb-2" style={{ fontFamily: FONT_BODY }}>Choisir la devise</p>
            <div className="flex gap-2 mb-5">
              {Object.keys(rates).map((c) => (
                <button key={c} onClick={() => setCoin(c)}
                  style={{ fontFamily: FONT_MONO }}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold border ${coin === c ? "bg-[#3D2145] text-[#FBF3E7] border-[#3D2145]" : "bg-white text-[#2B2320] border-[#EADFC7]"}`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-[#EADFC7] p-4 mb-4">
              <p className="text-[#8A7F6E] text-xs" style={{ fontFamily: FONT_BODY }}>Montant à envoyer</p>
              <p style={{ fontFamily: FONT_MONO }} className="text-2xl font-semibold text-[#2B2320] mt-1">{amount} {coin}</p>
              <p className="text-[#8A7F6E] text-xs mt-1">≈ {total.toFixed(2)} €</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#EADFC7] p-4 mb-4">
              <p className="text-[#8A7F6E] text-xs mb-2" style={{ fontFamily: FONT_BODY }}>Adresse de dépôt</p>
              <div className="flex items-center justify-between bg-[#FBF3E7] rounded-xl px-3 py-2">
                <span style={{ fontFamily: FONT_MONO }} className="text-xs text-[#2B2320] truncate">{address}</span>
                <Copy size={14} className="text-[#8A7F6E] shrink-0 ml-2" />
              </div>
            </div>
            <p className="text-[#8A7F6E] text-[11px] leading-relaxed" style={{ fontFamily: FONT_BODY }}>
              Démo — brancher un vrai fournisseur (Crypto Pay API) pour générer l'adresse et confirmer automatiquement.
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[#7A8B69] flex items-center justify-center mb-4">
              <Check size={28} className="text-white" />
            </div>
            <p style={{ fontFamily: FONT_DISPLAY }} className="text-xl font-semibold text-[#2B2320]">Paiement reçu</p>
            <p className="text-[#8A7F6E] text-sm mt-1">Merci pour votre commande !</p>
          </div>
        )}
      </div>
      {status !== "paid" && (
        <div className="px-4 py-4 border-t border-[#EADFC7]">
          <button onClick={handleConfirm} disabled={status === "waiting"}
            style={{ fontFamily: FONT_BODY }}
            className="w-full bg-[#3D2145] text-[#FBF3E7] font-semibold rounded-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-70">
            {status === "waiting" ? (<><Loader2 size={16} className="animate-spin" /> Vérification…</>) : "J'ai envoyé le paiement"}
          </button>
        </div>
      )}
    </div>
  );
}

function CartView({ cart, onClose, onQtyChange, onCheckout }) {
  const total = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  return (
    <div className="fixed inset-0 z-40 bg-[#FBF3E7] flex flex-col max-w-sm mx-auto">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#EADFC7]">
        <button onClick={onClose}><ArrowLeft size={20} className="text-[#2B2320]" /></button>
        <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-lg font-semibold text-[#2B2320]">Votre panier</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {cart.length === 0 && <p className="text-[#8A7F6E] text-sm mt-10 text-center">Panier vide — allez choisir un plat.</p>}
        {cart.map((item) => (
          <div key={item.key} className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-[#EADFC7]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden" style={{ backgroundColor: item.product.color + "22" }}>
              <Media src={item.product.image} emoji={item.product.emoji} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: FONT_DISPLAY }} className="text-sm font-semibold text-[#2B2320] truncate">
                {item.product.name}{item.variant ? ` · ${item.variant.label}` : ""}
              </p>
              <PriceTag price={item.unitPrice} prefix="" />
            </div>
            <div className="flex items-center gap-2 bg-[#FBF3E7] rounded-full px-2 py-1">
              <button onClick={() => onQtyChange(item.key, item.qty - 1)}><Minus size={14} /></button>
              <span style={{ fontFamily: FONT_MONO }} className="w-4 text-center text-xs">{item.qty}</span>
              <button onClick={() => onQtyChange(item.key, item.qty + 1)}><Plus size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {cart.length > 0 && (
        <div className="px-4 py-4 border-t border-[#EADFC7] bg-[#FBF3E7]">
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontFamily: FONT_BODY }} className="text-sm text-[#8A7F6E]">Total</span>
            <span style={{ fontFamily: FONT_MONO }} className="text-lg font-semibold text-[#2B2320]">{total.toFixed(2)} €</span>
          </div>
          <button onClick={onCheckout} style={{ fontFamily: FONT_BODY }}
            className="w-full bg-[#3D2145] text-[#FBF3E7] font-semibold rounded-full py-3 text-sm">
            Payer en cryptomonnaie
          </button>
        </div>
      )}
    </div>
  );
}

function ProductAdminRow({ p, update, remove }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadMedia(file);
      update(p.id, "image", url);
    } catch (err) {
      setError("Échec de l'envoi, réessaie");
    }
    setUploading(false);
  };

  const variants = p.variants || [];
  const updateVariant = (idx, field, value) => {
    const next = variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v));
    update(p.id, "variants", next);
  };
  const removeVariant = (idx) => update(p.id, "variants", variants.filter((_, i) => i !== idx));
  const addVariant = () => update(p.id, "variants", [...variants, { label: "100g", price: 0 }]);

  return (
    <div className="bg-white rounded-2xl border border-[#EADFC7] p-3">
      <div className="flex items-start gap-3">
        <div className="relative w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden" style={{ backgroundColor: p.color + "22" }}>
          <Media src={p.image} emoji={p.emoji} className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input value={p.name} onChange={(e) => update(p.id, "name", e.target.value)}
            className="w-full border border-[#EADFC7] rounded-lg px-2 py-1 text-sm font-semibold" placeholder="Nom du produit" />
          <input value={p.desc} onChange={(e) => update(p.id, "desc", e.target.value)}
            className="w-full border border-[#EADFC7] rounded-lg px-2 py-1 text-xs" placeholder="Description" />

          <label className="flex items-center justify-center gap-2 border border-dashed border-[#D9A441] text-[#B8862F] rounded-lg px-2 py-2 text-xs font-semibold cursor-pointer">
            <ImageIcon size={14} />
            {uploading ? "Envoi en cours..." : "Choisir photo/vidéo depuis la galerie"}
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
          {error && <p className="text-[#B65C4A] text-[11px]">{error}</p>}

          {variants.length === 0 && (
            <input type="number" step="0.1" value={p.price} onChange={(e) => update(p.id, "price", parseFloat(e.target.value) || 0)}
              className="w-24 border border-[#EADFC7] rounded-lg px-2 py-1 text-xs" style={{ fontFamily: FONT_MONO }} placeholder="Prix €" />
          )}

          <div className="border-t border-[#EADFC7] pt-2">
            <p className="text-[11px] font-semibold text-[#8A7F6E] mb-1">Options de prix (poids, taille...)</p>
            {variants.map((v, idx) => (
              <div key={idx} className="flex gap-2 mb-1">
                <input value={v.label} onChange={(e) => updateVariant(idx, "label", e.target.value)}
                  className="flex-1 border border-[#EADFC7] rounded-lg px-2 py-1 text-xs" placeholder="ex: 100g" />
                <input type="number" step="0.1" value={v.price} onChange={(e) => updateVariant(idx, "price", parseFloat(e.target.value) || 0)}
                  className="w-20 border border-[#EADFC7] rounded-lg px-2 py-1 text-xs" style={{ fontFamily: FONT_MONO }} placeholder="Prix €" />
                <button onClick={() => removeVariant(idx)} className="text-[#B65C4A]"><Trash2 size={16} /></button>
              </div>
            ))}
            <button onClick={addVariant} className="text-[11px] font-semibold text-[#7A8B69] mt-1">+ Ajouter une option de prix</button>
          </div>

          <div className="flex flex-wrap gap-1">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => update(p.id, "emoji", e)}
                className={`text-lg px-1.5 rounded ${p.emoji === e ? "bg-[#EADFC7]" : ""}`}>{e}</button>
            ))}
          </div>
        </div>
        <button onClick={() => remove(p.id)} className="text-[#B65C4A] shrink-0"><Trash2 size={18} /></button>
      </div>
    </div>
  );
}

function AdminPanel({ state, adminPin, onClose, onSave }) {
  const [draft, setDraft] = useState(state);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [section, setSection] = useState("shop");
  const [saving, setSaving] = useState(false);

  const updateProduct = (id, field, value) => {
    setDraft((prev) => ({ ...prev, products: prev.products.map((p) => (p.id === id ? { ...p, [field]: value } : p)) }));
  };
  const removeProduct = (id) => setDraft((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
  const addProduct = () => {
    const nextId = Math.max(0, ...draft.products.map((p) => p.id)) + 1;
    setDraft((prev) => ({ ...prev, products: [...prev.products, {
      id: nextId, num: String(nextId).padStart(2, "0"),
      name: "Nouveau produit", desc: "Description à modifier", price: 9.9,
      color: "#D9A441", emoji: "🍽️", image: "", variants: []
    }] }));
  };

  const updateButton = (id, field, value) => {
    setDraft((prev) => ({ ...prev, customButtons: prev.customButtons.map((b) => (b.id === id ? { ...b, [field]: value } : b)) }));
  };
  const removeButton = (id) => setDraft((prev) => ({ ...prev, customButtons: prev.customButtons.filter((b) => b.id !== id) }));
  const addButton = () => {
    const nextId = Math.max(0, ...draft.customButtons.map((b) => b.id), 0) + 1;
    setDraft((prev) => ({ ...prev, customButtons: [...prev.customButtons, { id: nextId, label: "Instagram", emoji: "📸", url: "" }] }));
  };

  const handleSave = async () => {
    let pinToSave = adminPin;
    if (newPin) {
      if (newPin.length < 4) { setPinMsg("4 caractères minimum"); return; }
      if (newPin !== newPinConfirm) { setPinMsg("Les deux codes ne correspondent pas"); return; }
      pinToSave = newPin;
    }
    setSaving(true);
    await onSave(draft, pinToSave);
    setSaving(false);
    onClose();
  };

  if (!unlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-[#2B2320]/60 flex items-center justify-center">
        <div className="bg-[#FBF3E7] rounded-2xl p-5 w-72">
          <p style={{ fontFamily: FONT_DISPLAY }} className="text-[#2B2320] font-semibold mb-3">Code administrateur</p>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
            className="w-full border border-[#EADFC7] rounded-xl px-3 py-2 mb-3 text-sm" placeholder="••••" />
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-[#EADFC7] text-sm text-[#8A7F6E]">Annuler</button>
            <button onClick={() => pin === adminPin ? setUnlocked(true) : setPin("")}
              className="flex-1 py-2 rounded-xl bg-[#3D2145] text-[#FBF3E7] text-sm font-semibold">Entrer</button>
          </div>
        </div>
      </div>
    );
  }

  const TABS = [["shop", "Boutique"], ["contact", "Contact"], ["buttons", "Boutons"], ["products", "Produits"]];

  return (
    <div className="fixed inset-0 z-50 bg-[#FBF3E7] flex flex-col max-w-sm mx-auto">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#EADFC7]">
        <div className="flex items-center gap-3">
          <button onClick={onClose}><ArrowLeft size={20} className="text-[#2B2320]" /></button>
          <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-lg font-semibold text-[#2B2320]">Administration</h2>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ fontFamily: FONT_BODY }}
          className="text-sm font-semibold bg-[#7A8B69] text-white rounded-full px-4 py-1.5 disabled:opacity-60">
          {saving ? "..." : "Enregistrer"}
        </button>
      </div>

      <div className="flex px-4 pt-3 gap-1 border-b border-[#EADFC7] overflow-x-auto">
        {TABS.map(([val, lbl]) => (
          <button key={val} onClick={() => setSection(val)}
            style={{ fontFamily: FONT_BODY }}
            className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 ${section === val ? "border-[#3D2145] text-[#2B2320]" : "border-transparent text-[#8A7F6E]"}`}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {section === "shop" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-[#EADFC7] p-4">
              <p className="text-xs font-semibold text-[#2B2320] mb-2" style={{ fontFamily: FONT_BODY }}>Nom de la boutique</p>
              <input value={draft.shopName} onChange={(e) => setDraft((d) => ({ ...d, shopName: e.target.value }))}
                className="w-full border border-[#EADFC7] rounded-lg px-3 py-2 text-sm font-semibold" placeholder="Petit Chef" />
              <p className="text-xs font-semibold text-[#2B2320] mt-3 mb-2" style={{ fontFamily: FONT_BODY }}>Sous-titre</p>
              <input value={draft.tagline} onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
                className="w-full border border-[#EADFC7] rounded-lg px-3 py-2 text-sm" placeholder="La boutique du mini cuisinier" />
            </div>
            <div className="bg-white rounded-2xl border border-[#EADFC7] p-4">
              <p className="text-xs font-semibold text-[#2B2320] mb-2 flex items-center gap-2" style={{ fontFamily: FONT_BODY }}>
                <Lock size={14} /> Code administrateur
              </p>
              <div className="flex gap-2">
                <input type="password" placeholder="Nouveau code" value={newPin}
                  onChange={(e) => { setNewPin(e.target.value); setPinMsg(""); }}
                  className="flex-1 border border-[#EADFC7] rounded-lg px-2 py-1.5 text-sm" />
                <input type="password" placeholder="Confirmer" value={newPinConfirm}
                  onChange={(e) => { setNewPinConfirm(e.target.value); setPinMsg(""); }}
                  className="flex-1 border border-[#EADFC7] rounded-lg px-2 py-1.5 text-sm" />
              </div>
              {pinMsg && <p className="text-[#B65C4A] text-xs mt-1">{pinMsg}</p>}
              <p className="text-[#8A7F6E] text-[11px] mt-1">Laisse vide pour garder le code actuel. Ce code reste propre à cet appareil.</p>
            </div>
          </div>
        )}

        {section === "contact" && (
          <div className="bg-white rounded-2xl border border-[#EADFC7] p-4">
            <p className="text-xs font-semibold text-[#2B2320] mb-2" style={{ fontFamily: FONT_BODY }}>Texte du bouton</p>
            <input value={draft.contact.label}
              onChange={(e) => setDraft((d) => ({ ...d, contact: { ...d.contact, label: e.target.value } }))}
              className="w-full border border-[#EADFC7] rounded-lg px-2 py-1.5 text-sm mb-3" placeholder="Une question ?" />
            <div className="flex gap-1 mb-3">
              {[["whatsapp","WhatsApp"],["telegram","Telegram"],["email","Email"],["tel","Téléphone"]].map(([val, lbl]) => (
                <button key={val} onClick={() => setDraft((d) => ({ ...d, contact: { ...d.contact, type: val } }))}
                  style={{ fontFamily: FONT_MONO }}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold border ${draft.contact.type === val ? "bg-[#3D2145] text-white border-[#3D2145]" : "bg-white text-[#2B2320] border-[#EADFC7]"}`}>
                  {lbl}
                </button>
              ))}
            </div>
            <input value={draft.contact.value}
              onChange={(e) => setDraft((d) => ({ ...d, contact: { ...d.contact, value: e.target.value } }))}
              className="w-full border border-[#EADFC7] rounded-lg px-2 py-1.5 text-sm"
              placeholder={
                draft.contact.type === "whatsapp" ? "Numéro avec indicatif, ex: 33612345678" :
                draft.contact.type === "telegram" ? "@tonpseudo" :
                draft.contact.type === "email" ? "toi@exemple.com" : "06 12 34 56 78"
              } />
          </div>
        )}

        {section === "buttons" && (
          <>
            {draft.customButtons.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-[#EADFC7] p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input value={b.label} onChange={(e) => updateButton(b.id, "label", e.target.value)}
                      className="w-full border border-[#EADFC7] rounded-lg px-2 py-1 text-sm font-semibold" placeholder="Texte du bouton" />
                    <input value={b.url} onChange={(e) => updateButton(b.id, "url", e.target.value)}
                      className="w-full border border-[#EADFC7] rounded-lg px-2 py-1 text-xs" placeholder="https://instagram.com/..." />
                    <div className="flex flex-wrap gap-1">
                      {BUTTON_EMOJIS.map((e) => (
                        <button key={e} onClick={() => updateButton(b.id, "emoji", e)}
                          className={`text-lg px-1.5 rounded ${b.emoji === e ? "bg-[#EADFC7]" : ""}`}>{e}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => removeButton(b.id)} className="text-[#B65C4A] shrink-0"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
            <button onClick={addButton} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#EADFC7] text-[#8A7F6E] text-sm font-semibold flex items-center justify-center gap-2" style={{ fontFamily: FONT_BODY }}>
              <Link2 size={15} /> Ajouter un bouton
            </button>
          </>
        )}

        {section === "products" && (
          <>
            {draft.products.map((p) => (
              <ProductAdminRow key={p.id} p={p} update={updateProduct} remove={removeProduct} />
            ))}
            <button onClick={addProduct} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#EADFC7] text-[#8A7F6E] text-sm font-semibold" style={{ fontFamily: FONT_BODY }}>
              + Ajouter un produit
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { haptic, inTelegram } = useTelegram();
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [adminPin, setAdminPin] = useState(loadPin());
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCrypto, setShowCrypto] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    loadState().then((s) => { setState(s); setLoading(false); });
  }, []);

  const contactLink = contactHref(state.contact);
  const ContactIcon = contactIcon(state.contact.type);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  const addToCart = (product, qty, variant) => {
    const unitPrice = variant ? variant.price : product.price;
    const key = product.id + (variant ? `-${variant.label}` : "");
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { key, product, qty, variant, unitPrice }];
    });
  };
  const updateQty = (key, qty) => {
    setCart((prev) => (qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty } : i))));
  };
  const handleSaveAll = async (newState, newPin) => {
    setState(newState);
    await saveState(newState);
    setAdminPin(newPin);
    savePin(newPin);
  };
  const handlePaid = () => {
    setTimeout(() => { setCart([]); setShowCrypto(false); setShowCart(false); }, 1200);
  };

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: "#EADFC7", fontFamily: FONT_BODY }}>
      <div className="w-full max-w-sm bg-[#FBF3E7] min-h-screen relative">
        <div className="sticky top-0 z-10 bg-[#FBF3E7]/95 backdrop-blur px-4 pt-5 pb-3 border-b border-[#EADFC7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#3D2145] flex items-center justify-center">
              <ChefHat size={18} className="text-[#FBF3E7]" />
            </div>
            <div>
              <h1 style={{ fontFamily: FONT_DISPLAY }} className="text-[#2B2320] text-lg font-semibold leading-none">{state.shopName}</h1>
              <p className="text-[#8A7F6E] text-[11px] mt-0.5">{state.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdmin(true)} className="w-9 h-9 rounded-full bg-white border border-[#EADFC7] flex items-center justify-center">
              <Settings size={16} className="text-[#8A7F6E]" />
            </button>
            <button onClick={() => setShowCart(true)} className="relative w-10 h-10 rounded-full bg-white border border-[#EADFC7] flex items-center justify-center">
              <ShoppingBag size={18} className="text-[#2B2320]" />
              {cartCount > 0 && (
                <span style={{ fontFamily: FONT_MONO }} className="absolute -top-1 -right-1 bg-[#B65C4A] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="px-4 pt-4 pb-2">
          <p style={{ fontFamily: FONT_MONO }} className="text-[#B65C4A] text-xs tracking-wide">LE MENU DU JOUR</p>
          <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-[#2B2320] text-2xl font-semibold mt-1">{state.products.length} plats à croquer</h2>

          <div className="flex flex-wrap gap-2 mt-2">
            {contactLink && (
              <a href={contactLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5"
                style={{ fontFamily: FONT_BODY, backgroundColor: "#7A8B6922", color: "#7A8B69" }}>
                <ContactIcon size={13} /> {state.contact.label || "Nous contacter"}
              </a>
            )}
            {state.customButtons.filter(b => b.url).map((b) => (
              <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5"
                style={{ fontFamily: FONT_BODY, backgroundColor: "#D9A44122", color: "#B8862F" }}>
                <span>{b.emoji}</span> {b.label}
              </a>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#8A7F6E]" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4 py-3 pb-24">
            {state.products.map((p) => <ProductCard key={p.id} product={p} onOpen={setSelected} />)}
          </div>
        )}

        {cartCount > 0 && !showCart && (
          <button onClick={() => setShowCart(true)} style={{ fontFamily: FONT_BODY }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[336px] bg-[#3D2145] text-[#FBF3E7] rounded-full py-3 px-5 flex items-center justify-between shadow-lg">
            <span className="text-sm font-semibold">{cartCount} article{cartCount > 1 ? "s" : ""}</span>
            <span style={{ fontFamily: FONT_MONO }} className="text-sm">Voir le panier →</span>
          </button>
        )}

        <ProductSheet product={selected} onClose={() => setSelected(null)} onAdd={addToCart} haptic={haptic} />
        {showCart && !showCrypto && (
          <CartView cart={cart} onClose={() => setShowCart(false)} onQtyChange={updateQty} onCheckout={() => setShowCrypto(true)} />
        )}
        {showCrypto && <CryptoCheckout total={total} onClose={() => setShowCrypto(false)} onPaid={handlePaid} />}
        {showAdmin && (
          <AdminPanel
            state={state}
            adminPin={adminPin}
            onClose={() => setShowAdmin(false)}
            onSave={handleSaveAll}
          />
        )}
      </div>
    </div>
  );
}
