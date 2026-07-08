import React, { useState, useEffect } from "react";
import {
  ShoppingBag, X, Plus, Minus, ChefHat, ArrowLeft,
  Settings, Trash2, Check, Copy, Loader2
} from "lucide-react";

import { MessageCircle, Send, Mail, Phone, Lock } from "lucide-react";

const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'Karla', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";
const PRODUCTS_KEY = "petitchef_products";
const PIN_KEY = "petitchef_admin_pin";
const CONTACT_KEY = "petitchef_contact";
const DEFAULT_PIN = "1234";
const DEFAULT_CONTACT = { type: "whatsapp", value: "", label: "Une question ?" };
const EMOJIS = ["🧑‍🍳","🧸","🃏","👨‍🍳","📖","🥄","🍳","🧁","🍰","🥐","🍕","🍩","🧂","🥕"];
const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;

function loadPin() {
  try { return localStorage.getItem(PIN_KEY) || DEFAULT_PIN; } catch (e) { return DEFAULT_PIN; }
}
function savePin(pin) {
  try { localStorage.setItem(PIN_KEY, pin); } catch (e) {}
}
function loadContact() {
  try {
    const raw = localStorage.getItem(CONTACT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_CONTACT;
}
function saveContact(contact) {
  try { localStorage.setItem(CONTACT_KEY, JSON.stringify(contact)); } catch (e) {}
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

const DEFAULT_PRODUCTS = [
  { id: 1, num: "01", name: "Tablier Petit Chef", desc: "Coton épais, poche frontale, taille unique.", price: 19.9, color: "#D9A441", emoji: "🧑‍🍳" },
  { id: 2, num: "02", name: "Peluche Chef Câlin", desc: "30cm, toque brodée, lavable en machine.", price: 24.5, color: "#7A8B69", emoji: "🧸" },
  { id: 3, num: "03", name: "Cartes Recettes", desc: "Lot de 12, recettes faciles en famille.", price: 14.0, color: "#B65C4A", emoji: "🃏" },
  { id: 4, num: "04", name: "Toque de Chef", desc: "Ajustable, broderie prénom en option.", price: 12.9, color: "#3D2145", emoji: "👨‍🍳" },
];

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

function loadProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_PRODUCTS;
}
function saveProducts(products) {
  try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); } catch (e) {}
}

function PriceTag({ price }) {
  return <span style={{ fontFamily: FONT_MONO }} className="text-sm">{price.toFixed(2)}&nbsp;€</span>;
}

function ProductCard({ product, onOpen }) {
  return (
    <button onClick={() => onOpen(product)}
      className="text-left bg-[#FFFEFB] rounded-2xl overflow-hidden border border-[#EADFC7] active:scale-[0.98] transition-transform">
      <div className="h-28 flex items-center justify-center text-5xl relative overflow-hidden" style={{ backgroundColor: product.color + "22" }}>
        {product.image
          ? (VIDEO_EXT.test(product.image)
              ? <video src={product.image} className="w-full h-full object-cover" autoPlay muted loop playsInline />
              : <img src={product.image} alt={product.name} className="w-full h-full object-cover" />)
          : <span>{product.emoji}</span>}
        <span style={{ fontFamily: FONT_MONO, color: product.color }}
          className="absolute top-2 left-2 text-[11px] font-semibold bg-white/80 rounded-full px-2 py-0.5">
          Plat №{product.num}
        </span>
      </div>
      <div className="p-3">
        <h3 style={{ fontFamily: FONT_DISPLAY }} className="text-[#2B2320] text-[15px] leading-tight font-semibold">{product.name}</h3>
        <p className="text-[#8A7F6E] text-xs mt-1 leading-snug line-clamp-2">{product.desc}</p>
        <div className="mt-2 flex items-center justify-between">
          <PriceTag price={product.price} />
          <span className="text-xs font-semibold rounded-full px-2 py-1" style={{ backgroundColor: product.color, color: "#FFFEFB", fontFamily: FONT_BODY }}>+ Ajouter</span>
        </div>
      </div>
    </button>
  );
}

function ProductSheet({ product, onClose, onAdd, haptic }) {
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [product]);
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-[#2B2320]/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#FBF3E7] rounded-t-3xl p-5 pb-6 animate-[slideUp_0.25s_ease-out]">
        <div className="flex justify-between items-start mb-3">
          <span style={{ fontFamily: FONT_MONO, color: product.color }} className="text-xs font-semibold">Plat №{product.num}</span>
          <button onClick={onClose} className="text-[#8A7F6E]"><X size={20} /></button>
        </div>
        <div className="h-32 rounded-2xl flex items-center justify-center text-6xl mb-3 overflow-hidden" style={{ backgroundColor: product.color + "22" }}>
          {product.image
            ? (VIDEO_EXT.test(product.image)
                ? <video src={product.image} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                : <img src={product.image} alt={product.name} className="w-full h-full object-cover" />)
            : product.emoji}
        </div>
        <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-[#2B2320] text-xl font-semibold">{product.name}</h2>
        <p className="text-[#8A7F6E] text-sm mt-1">{product.desc}</p>
        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center gap-3 bg-white rounded-full px-3 py-2 border border-[#EADFC7]">
            <button onClick={() => { setQty(q => Math.max(1, q - 1)); haptic(); }}><Minus size={16} /></button>
            <span style={{ fontFamily: FONT_MONO }} className="w-4 text-center">{qty}</span>
            <button onClick={() => { setQty(q => q + 1); haptic(); }}><Plus size={16} /></button>
          </div>
          <PriceTag price={product.price * qty} />
        </div>
        <button onClick={() => { onAdd(product, qty); haptic("medium"); onClose(); }}
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
  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  return (
    <div className="fixed inset-0 z-40 bg-[#FBF3E7] flex flex-col max-w-sm mx-auto">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#EADFC7]">
        <button onClick={onClose}><ArrowLeft size={20} className="text-[#2B2320]" /></button>
        <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-lg font-semibold text-[#2B2320]">Votre panier</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {cart.length === 0 && <p className="text-[#8A7F6E] text-sm mt-10 text-center">Panier vide — allez choisir un plat.</p>}
        {cart.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-[#EADFC7]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden" style={{ backgroundColor: item.product.color + "22" }}>
              {item.product.image ? <img src={item.product.image} className="w-full h-full object-cover" /> : item.product.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: FONT_DISPLAY }} className="text-sm font-semibold text-[#2B2320] truncate">{item.product.name}</p>
              <PriceTag price={item.product.price} />
            </div>
            <div className="flex items-center gap-2 bg-[#FBF3E7] rounded-full px-2 py-1">
              <button onClick={() => onQtyChange(item.product.id, item.qty - 1)}><Minus size={14} /></button>
              <span style={{ fontFamily: FONT_MONO }} className="w-4 text-center text-xs">{item.qty}</span>
              <button onClick={() => onQtyChange(item.product.id, item.qty + 1)}><Plus size={14} /></button>
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

function AdminPanel({ products, contact, adminPin, onClose, onSave }) {
  const [draft, setDraft] = useState(products);
  const [draftContact, setDraftContact] = useState(contact);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const update = (id, field, value) => {
    setDraft((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const remove = (id) => setDraft((prev) => prev.filter((p) => p.id !== id));
  const addNew = () => {
    const nextId = Math.max(0, ...draft.map((p) => p.id)) + 1;
    setDraft((prev) => [...prev, {
      id: nextId, num: String(nextId).padStart(2, "0"),
      name: "Nouveau produit", desc: "Description à modifier", price: 9.9,
      color: "#D9A441", emoji: "🍽️", image: ""
    }]);
  };
  const handleSave = () => {
    let pinToSave = adminPin;
    if (newPin) {
      if (newPin.length < 4) { setPinMsg("4 caractères minimum"); return; }
      if (newPin !== newPinConfirm) { setPinMsg("Les deux codes ne correspondent pas"); return; }
      pinToSave = newPin;
    }
    onSave(draft, draftContact, pinToSave);
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

  return (
    <div className="fixed inset-0 z-50 bg-[#FBF3E7] flex flex-col max-w-sm mx-auto">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#EADFC7]">
        <div className="flex items-center gap-3">
          <button onClick={onClose}><ArrowLeft size={20} className="text-[#2B2320]" /></button>
          <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-lg font-semibold text-[#2B2320]">Gérer les produits</h2>
        </div>
        <button onClick={handleSave} style={{ fontFamily: FONT_BODY }}
          className="text-sm font-semibold bg-[#7A8B69] text-white rounded-full px-4 py-1.5">
          Enregistrer
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <button onClick={() => setShowSettings((s) => !s)}
          className="w-full flex items-center justify-between bg-white rounded-2xl border border-[#EADFC7] px-4 py-3">
          <span style={{ fontFamily: FONT_BODY }} className="text-sm font-semibold text-[#2B2320] flex items-center gap-2">
            <Lock size={15} /> Réglages boutique
          </span>
          <span className="text-[#8A7F6E] text-xs">{showSettings ? "Masquer ▲" : "Afficher ▼"}</span>
        </button>

        {showSettings && (
          <div className="bg-white rounded-2xl border border-[#EADFC7] p-4 space-y-4">
            <div>
              <p style={{ fontFamily: FONT_BODY }} className="text-xs font-semibold text-[#2B2320] mb-2">Changer le code admin</p>
              <div className="flex gap-2">
                <input type="password" placeholder="Nouveau code" value={newPin}
                  onChange={(e) => { setNewPin(e.target.value); setPinMsg(""); }}
                  className="flex-1 border border-[#EADFC7] rounded-lg px-2 py-1.5 text-sm" />
                <input type="password" placeholder="Confirmer" value={newPinConfirm}
                  onChange={(e) => { setNewPinConfirm(e.target.value); setPinMsg(""); }}
                  className="flex-1 border border-[#EADFC7] rounded-lg px-2 py-1.5 text-sm" />
              </div>
              {pinMsg && <p className="text-[#B65C4A] text-xs mt-1">{pinMsg}</p>}
              <p className="text-[#8A7F6E] text-[11px] mt-1">Laisse vide pour garder le code actuel. Le nouveau code s'applique en tapant "Enregistrer" en haut.</p>
            </div>

            <div className="border-t border-[#EADFC7] pt-4">
              <p style={{ fontFamily: FONT_BODY }} className="text-xs font-semibold text-[#2B2320] mb-2">Bouton de contact</p>
              <input value={draftContact.label}
                onChange={(e) => setDraftContact((c) => ({ ...c, label: e.target.value }))}
                className="w-full border border-[#EADFC7] rounded-lg px-2 py-1.5 text-sm mb-2" placeholder="Texte affiché (ex: Une question ?)" />
              <div className="flex gap-1 mb-2">
                {[["whatsapp","WhatsApp"],["telegram","Telegram"],["email","Email"],["tel","Téléphone"]].map(([val, lbl]) => (
                  <button key={val} onClick={() => setDraftContact((c) => ({ ...c, type: val }))}
                    style={{ fontFamily: FONT_MONO }}
                    className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold border ${draftContact.type === val ? "bg-[#3D2145] text-white border-[#3D2145]" : "bg-white text-[#2B2320] border-[#EADFC7]"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
              <input value={draftContact.value}
                onChange={(e) => setDraftContact((c) => ({ ...c, value: e.target.value }))}
                className="w-full border border-[#EADFC7] rounded-lg px-2 py-1.5 text-sm"
                placeholder={
                  draftContact.type === "whatsapp" ? "Numéro avec indicatif, ex: 33612345678" :
                  draftContact.type === "telegram" ? "@tonpseudo" :
                  draftContact.type === "email" ? "toi@exemple.com" : "06 12 34 56 78"
                } />
            </div>
          </div>
        )}

        {draft.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-[#EADFC7] p-3">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden" style={{ backgroundColor: p.color + "22" }}>
                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : p.emoji}
              </div>
              <div className="flex-1 space-y-2">
                <input value={p.name} onChange={(e) => update(p.id, "name", e.target.value)}
                  className="w-full border border-[#EADFC7] rounded-lg px-2 py-1 text-sm font-semibold" placeholder="Nom du produit" />
                <input value={p.desc} onChange={(e) => update(p.id, "desc", e.target.value)}
                  className="w-full border border-[#EADFC7] rounded-lg px-2 py-1 text-xs" placeholder="Description" />
                <div className="flex gap-2">
                  <input type="number" step="0.1" value={p.price} onChange={(e) => update(p.id, "price", parseFloat(e.target.value) || 0)}
                    className="w-20 border border-[#EADFC7] rounded-lg px-2 py-1 text-xs" style={{ fontFamily: FONT_MONO }} />
                  <input value={p.image || ""} onChange={(e) => update(p.id, "image", e.target.value)}
                    className="flex-1 border border-[#EADFC7] rounded-lg px-2 py-1 text-xs" placeholder="URL image ou vidéo (optionnel)" />
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
        ))}
        <button onClick={addNew} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#EADFC7] text-[#8A7F6E] text-sm font-semibold" style={{ fontFamily: FONT_BODY }}>
          + Ajouter un produit
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { haptic, inTelegram } = useTelegram();
  const [products, setProducts] = useState(loadProducts());
  const [contact, setContact] = useState(loadContact());
  const [adminPin, setAdminPin] = useState(loadPin());
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCrypto, setShowCrypto] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const contactLink = contactHref(contact);
  const ContactIcon = contactIcon(contact.type);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  const addToCart = (product, qty) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { product, qty }];
    });
  };
  const updateQty = (id, qty) => {
    setCart((prev) => (qty <= 0 ? prev.filter((i) => i.product.id !== id) : prev.map((i) => (i.product.id === id ? { ...i, qty } : i))));
  };
  const handleSaveAll = (newProducts, newContact, newPin) => {
    setProducts(newProducts); saveProducts(newProducts);
    setContact(newContact); saveContact(newContact);
    setAdminPin(newPin); savePin(newPin);
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
              <h1 style={{ fontFamily: FONT_DISPLAY }} className="text-[#2B2320] text-lg font-semibold leading-none">Petit Chef</h1>
              <p className="text-[#8A7F6E] text-[11px] mt-0.5">{inTelegram ? "Boutique Telegram" : "Aperçu navigateur"}</p>
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
          <h2 style={{ fontFamily: FONT_DISPLAY }} className="text-[#2B2320] text-2xl font-semibold mt-1">{products.length} plats à croquer</h2>
          {contactLink && (
            <a href={contactLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold rounded-full px-3 py-1.5"
              style={{ fontFamily: FONT_BODY, backgroundColor: "#7A8B6922", color: "#7A8B69" }}>
              <ContactIcon size={13} /> {contact.label || "Nous contacter"}
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 px-4 py-3 pb-24">
          {products.map((p) => <ProductCard key={p.id} product={p} onOpen={setSelected} />)}
        </div>

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
            products={products}
            contact={contact}
            adminPin={adminPin}
            onClose={() => setShowAdmin(false)}
            onSave={handleSaveAll}
          />
        )}
      </div>
    </div>
  );
}
