import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { 
  User, 
  Lock, 
  LogOut, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Menu, 
  X,
  Shield,
  TrendingUp,
  Activity,
  Sparkles,
  MessageCircle,
  Send,
  Bot,
  ChevronDown,
  ChevronUp,
  Mail,
  AlertCircle,
  PlayCircle,
  EyeOff, 
  Eye,
  Info,
  Share2, 
  BarChart2, 
  Bell,
  Download,
  ArrowRight,
  Layers,
  ExternalLink,
  Filter,
  Gem,
  Bookmark,
  MessageSquare,
  Globe,
  Loader,
  ThumbsUp, 
  ThumbsDown 
} from 'lucide-react';

// --- SABİT AYARLAR ---
// Güvenilir placeholder kullanılıyor.
const LOGO_URL = "https://placehold.co/40x40/10b981/ffffff?text=BZ"; 
const TELEGRAM_LINK = "https://t.me/betzadesohbet";

// --- SPONSOR / AFFILIATE LİNKLERİ ---
const SPONSOR_1 = {
  name: "Betvino", 
  image: "https://placehold.co/400x128/1e3a8a/ffffff?text=SPONSOR+1", 
  link: "https://go.aff.betvinodirect1.com/18wrmewy", 
  color: "from-blue-700 to-blue-900" 
};

const SPONSOR_2 = {
  name: "Betzade Resmi", 
  image: "https://placehold.co/400x128/dc2626/ffffff?text=SPONSOR+2", 
  link: "https://cutt.ly/FrjdD4Pt", 
  color: "from-red-600 to-orange-600" 
};

// --- FIREBASE YAPILANDIRMASI ---
const firebaseConfig = {
  apiKey: "AIzaSyBdC1VsXHe5rfy6P_Z18ZxiUI6GN0GXh_4",
  authDomain: "betzade-6765d.firebaseapp.com",
  projectId: "betzade-6765d",
  storageBucket: "betzade-6765d.firebasestorage.app",
  messagingSenderId: "1005901214574",
  appId: "1:1005901214574:web:d063b4850aafea4bda477f",
  measurementId: "G-E3SLLWD8ML"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'betzade-6765d';

// --- YAPAY ZEKA KODU ---
// KRİTİK DÜZELTME: process erişimini en güvenli şekilde yapıyoruz, yoksa direkt boş string atıyoruz.
// NOT: Anahtarın Vercel'de REACT_APP_GEMINI_API_KEY olarak tanımlanması GEREKİR.
const VERCEL_GEMINI_API_KEY = (() => {
    let key = '';
    try {
        if (typeof process !== 'undefined' && process.env) {
            // Vercel/Next/CRA ortamlarında bilinen tüm değişken adlarını dener
            key = process.env.REACT_APP_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
        }
    } catch (e) {
        // process tanımlı değilse bu blok çalışır ve key boş kalır, bu da beklenendir.
    }
    return key;
})();


/**
 * Üstel geri çekilme (exponential backoff) ile fetch isteği.
 * @param {string} url API URL'si
 * @param {object} options fetch seçenekleri (body, headers vb.)
 * @param {number} maxRetries maksimum deneme sayısı
 * @returns {Promise<Response>} API yanıtı
 */
const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            } else if (response.status === 429 || response.status >= 500) {
                // Sunucu hatası veya hız limitine takılma, tekrar dene
                if (i < maxRetries - 1) {
                    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            // Başarısız kalıcı hata (4xx, 5xx)
            throw new Error(`API Hatası: Durum Kodu ${response.status}`);
        } catch (error) {
            // Ağ veya parse hatası
            if (i === maxRetries - 1) {
                throw new Error(`Ağ/Bağlantı Hatası: ${error.message}`);
            }
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Tüm denemeler başarısız oldu.");
};

const callGemini = async (prompt, systemInstruction = "", showModal) => {
    const apiKey = VERCEL_GEMINI_API_KEY || ''; 
    if (!apiKey) {
        showModal({ title: "AI Yapılandırma Hatası", message: "Yapay zeka için API anahtarı (GEMINI_API_KEY) tanımlanmamış. Vercel ortam değişkenlerini kontrol edin." });
        console.error("Yapay zeka API anahtarı eksik.");
        return null;
    }
    
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: "application/json" }
        }),
    };

    const response = await fetchWithRetry(url, options);
    
    const data = await response.json();
    // Güvenli JSON parse işlemi
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) return JSON.parse(rawText);
    
    // API yanıtı başarılı (200), ancak içerik boş veya hatalıysa
    showModal({ title: "AI Hata", message: "Yapay zekadan beklenen formatta yanıt alınamadı. Lütfen tekrar deneyin." });
    return null;

  } catch (error) {
    console.error("AI API Hatası (Analiz Üretimi):", error.message);
    showModal({ 
        title: "Bağlantı Hatası", 
        message: `Yapay zeka analiz servisine bağlanılamıyor: ${error.message}. Konsolu kontrol edin.` 
    });
    return null;
  }
};

const callGeminiChat = async (history, newMessage, showModal) => {
    const apiKey = VERCEL_GEMINI_API_KEY || ''; 
    if (!apiKey) {
        showModal({ title: "AI Yapılandırma Hatası", message: "Yapay zeka için API anahtarı (GEMINI_API_KEY) tanımlanmamış. Vercel ortam değişkenlerini kontrol edin." });
        console.error("Yapay zeka API anahtarı eksik.");
        return "API Anahtarı eksik. Lütfen yöneticiye Vercel ayarlarına anahtarı eklemesini söyleyin.";
    }

  try {
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: newMessage }] });

    const systemPrompt = `Sen Betzade uygulamasının yapay zeka asistanısın ('Betzade Guru'). 
    Spor, analiz, istatistik ve bahis stratejileri konusunda uzman, samimi ve yardımsever bir dille cevap ver. 
    
    ÖNEMLİ TALİMAT: 
    Kullanıcılar "destek", "yardım", "iletişim", "yeni adres", "site kapandı mı", "bonus", "hangi siteden oynayayım" gibi konuları sorduğunda veya sohbetin başında/sonunda mutlaka şu cümleyi ekle:
    "Canlı destek, anlık bildirimler ve güncel adresler için Telegram kanalımıza katılın: ${TELEGRAM_LINK} . Ayrıca güvenilir bahis siteleri için ana sayfadaki sponsorlarımıza göz atabilirsiniz."
    Linkin başında ve sonunda boşluk bırak ki tıklanabilir olsun.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: { parts: [{ text: systemPrompt }] }
        }),
    };
    
    const response = await fetchWithRetry(url, options);

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Yapay zeka yanıt veremiyor.";
    
  } catch (error) {
    console.error("AI API Hatası (Chat):", error.message);
    showModal({ 
        title: "Chat Bağlantı Hatası", 
        message: `Yapay zeka asistanı şu an cevap veremiyor: ${error.message}. Lütfen daha sonra tekrar deneyin.` 
    });
    return "Bağlantı hatası.";
  }
};

// --- BİLEŞEN: YORUM VE GERİ BİLDİRİM KISMI ---
const CommentSection = ({ couponId, appUser, showModal }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const commentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'coupons', couponId, 'comments');

  // Yorumları Çek
  useEffect(() => {
    const q = query(commentsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      commentsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setComments(commentsData);
    });
    return () => unsubscribe();
  }, [couponId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !appUser) return;
    try {
      await addDoc(commentsRef, {
        text: newComment.trim(),
        userId: appUser.uid,
        userEmail: appUser.email,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (err) {
      showModal({ title: "Hata", message: "Yorum eklenemedi. Yetki sorunu olabilir." });
      console.error("Yorum ekleme hatası:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!appUser?.isAdmin) return;
    
    showModal({
        title: "Onay Gerekiyor",
        message: "Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?",
        type: 'confirm',
        onConfirm: async () => {
            try {
                await deleteDoc(doc(commentsRef, commentId));
                showModal({ title: "Başarılı", message: "Yorum silindi." });
            } catch (err) {
                showModal({ title: "Hata", message: "Yorum silinemedi. Yetki sorunu olabilir." });
                console.error("Yorum silme hatası:", err);
            }
        }
    });
  };


  const formatTime = (seconds) => {
    if (!seconds) return 'Az önce';
    const date = new Date(seconds * 1000);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
      <h5 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><MessageSquare size={16} /> Geri Bildirimler ({comments.length})</h5>
      
      {/* Yorum Ekleme Formu */}
      <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
        <input 
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={appUser ? "Yorumunuz..." : "Giriş yapmalısınız."}
          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-full px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500"
          disabled={!appUser}
        />
        <button 
          type="submit" 
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-full disabled:opacity-50 transition"
          disabled={!appUser || !newComment.trim()}
        >
          <Send size={16} />
        </button>
      </form>

      {/* Yorum Listesi */}
      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-zinc-500 text-xs italic">Henüz yorum yok. İlk yorumu sen yap!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="border-b border-zinc-700/50 pb-2">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] font-bold text-emerald-400">{c.userEmail?.split('@')[0]}</span>
                <div className="flex items-center gap-2">
                    {appUser?.isAdmin && (
                        <button onClick={() => handleDeleteComment(c.id)} className="text-red-500 hover:text-red-400 p-1" title="Yorumu Sil">
                            <Trash2 size={12} />
                        </button>
                    )}
                    <span className="text-[9px] text-zinc-500">{formatTime(c.createdAt?.seconds)}</span>
              </div>
            </div>
              <p className="text-xs text-zinc-300">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- BİLEŞEN: KUPON KARTI ---
const CouponCard = ({ coupon, appUser, handleUpdateStatus, handleDeleteCoupon, handleVote, showModal }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [voted, setVoted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Kupon Takip Etme Veritabanı Mantığı
  useEffect(() => {
    if (!appUser) return;
    const followRef = doc(db, 'artifacts', appId, 'users', appUser.uid, 'following', coupon.id);
    const unsubscribe = onSnapshot(followRef, (docSnap) => {
        setIsFollowing(docSnap.exists());
    });
    return () => unsubscribe();
  }, [appUser, coupon.id]);

  // Oy kullanma durumunu yerel olarak kontrol et (Çoklu oylamayı engeller)
  useEffect(() => {
    if(!appUser) return;
    // Oy kullanma durumunu kullanıcı bazında kontrol et
    const hasVoted = localStorage.getItem(`vote_${coupon.id}_${appUser.uid}`);
    if (hasVoted) setVoted(true);
  }, [coupon.id, appUser]);

  const isNew = (createdAt) => {
    if (!createdAt) return false;
    return coupon.status === 'pending';
  };

  // Oy kullanma fonksiyonu
  const onVote = (type) => {
    if (!appUser) {
      showModal({ title: "Giriş Yapın", message: "Oy kullanmak için giriş yapmalısınız." });
      return;
    }

    if (voted) {
      showModal({ title: "Uyarı", message: "Bu kupona zaten oy verdin!" });
      return;
    }
    
    // Oy verme işlemi
    handleVote(coupon.id, type);
    
    // Yerel olarak oy kullanma durumunu kaydet
    setVoted(true);
    localStorage.setItem(`vote_${coupon.id}_${appUser.uid}`, 'true');
  };

  const toggleFollow = async () => {
    if (!appUser) return;
    const followRef = doc(db, 'artifacts', appId, 'users', appUser.uid, 'following', coupon.id);
    try {
      if (isFollowing) {
        await deleteDoc(followRef);
      } else {
        await setDoc(followRef, { couponId: coupon.id, followedAt: serverTimestamp(), couponTitle: coupon.title });
      }
    } catch (err) {
      console.error("Takip hatası:", err);
    }
  };

  const onShare = async () => {
    const matchesList = coupon.matches || [];
    const matchesText = matchesList.map(m => `⚽ ${m.homeTeam} vs ${m.awayTeam} -> ${m.prediction}`).join('\n');
    const shareData = {
      title: 'Betzade Kuponu',
      text: `🔥 ${coupon.title || 'Günün Kuponu'}\n\n${matchesText}\n\n🚀 Toplam Oran: ${coupon.totalOdds}\n\nDetaylar Betzade'de!`,
      url: window.location.href
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      showModal({ title: "Kopyalandı", message: "Kupon bilgileri panoya kopyalandı!" });
    }
  };

  const statusColors = {
    won: 'border-emerald-500/50 bg-emerald-950/10',
    lost: 'border-red-500/50 bg-red-950/10',
    live: 'border-blue-500/50 bg-blue-950/10',
    pending: 'border-zinc-800 bg-zinc-900'
  };

  const matches = coupon.matches || [];

  return (
    <div className={`border rounded-xl p-4 shadow-lg transition duration-300 relative overflow-hidden group ${statusColors[coupon.status] || 'border-zinc-800 bg-zinc-900'}`}>
      
      <div className="flex justify-between items-start mb-4 pb-2 border-b border-zinc-800/50">
        <div className="flex flex-col">
           <div className="flex items-center gap-2 mb-1">
             <span className="bg-zinc-800 text-zinc-300 text-xs font-bold px-2 py-1 rounded uppercase">{coupon.title || 'Kombine Kupon'}</span>
             {isNew(coupon.createdAt) && <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded animate-pulse">YENİ</span>}
           </div>
           {/* Kupon Sahibi */}
           <div className="flex items-center gap-2 text-zinc-500 text-[10px] pl-1">
              <User size={12}/> {coupon.adminEmail?.split('@')[0] || 'Admin'}
           </div>
        </div>

        <div className="flex flex-col items-end gap-1">
           {coupon.status === 'won' && <span className="text-emerald-400 font-bold text-xs flex items-center gap-1"><CheckCircle size={14}/> KAZANDI</span>}
           {coupon.status === 'lost' && <span className="text-red-400 font-bold text-xs flex items-center gap-1"><XCircle size={14}/> KAYBETTİ</span>}
           {coupon.status === 'live' && <span className="text-blue-400 font-bold text-xs flex items-center gap-1"><Activity size={14}/> CANLI</span>}
           <button onClick={toggleFollow} className={`p-1 rounded-full transition ${isFollowing ? 'bg-yellow-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`} title={isFollowing ? 'Takip Ediliyor' : 'Takip Et'}>
              <Bookmark size={14}/>
           </button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {matches.length > 0 ? matches.map((m, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[10px] font-mono">{m.time?.split('T')[1] || '00:00'}</span>
                <span className="font-medium text-zinc-300 truncate w-32 sm:w-48">{m.homeTeam} - {m.awayTeam}</span>
              </div>
              <div className="text-[10px] text-zinc-500 pl-10">{m.league}</div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-emerald-400 font-bold">{m.prediction}</span>
              <span className="text-zinc-500 text-[10px] bg-zinc-800/50 px-1 rounded">{m.odds}</span>
            </div>
          </div>
        )) : <div className="text-zinc-500 text-xs italic">Maç bilgisi yok.</div>}
      </div>
      
      {/* OY KULLANMA VE KUOPON İSTATİSTİKLERİ */}
      <div className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 mb-3">
        <div className="flex items-center gap-4">
            {/* Upvote */}
            <button 
                onClick={() => onVote('upvotes')} 
                disabled={voted || !appUser}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition disabled:opacity-50 ${voted && coupon.upvotes ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-emerald-400'}`}
                title={appUser ? (voted ? "Zaten oy verildi" : "Kuponu Beğen") : "Giriş yapın"}
            >
                <ThumbsUp size={14} /> 
                <span className="text-white ml-0.5">{coupon.upvotes || 0}</span>
            </button>
            {/* Downvote */}
            <button 
                onClick={() => onVote('downvotes')} 
                disabled={voted || !appUser}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition disabled:opacity-50 ${voted && coupon.downvotes ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-red-400'}`}
                title={appUser ? (voted ? "Zaten oy verildi" : "Kuponu Beğenme") : "Giriş yapın"}
            >
                <ThumbsDown size={14} />
                <span className="text-white ml-0.5">{coupon.downvotes || 0}</span>
            </button>
        </div>
        <div className="text-right">
             <p className="text-[10px] text-zinc-500">KAYIT TARİHİ</p>
             <p className="text-xs font-medium text-zinc-300">{coupon.createdAt?.seconds ? new Date(coupon.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</p>
        </div>
      </div>


      <div className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
        <div className="flex items-center gap-3">
           {coupon.playLink && (
             <a href={coupon.playLink.startsWith('http') ? coupon.playLink : `https://${coupon.playLink}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition shadow-lg shadow-blue-900/20">
               <ExternalLink size={12} /> HEMEN OYNA
             </a>
           )}
           <button onClick={onShare} className="text-zinc-400 hover:text-emerald-400 flex items-center gap-1 text-xs"><Share2 size={12}/> Paylaş</button>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-500">TOPLAM ORAN</p>
          <p className="text-xl font-bold text-white">{coupon.totalOdds}</p>
        </div>
      </div>

      {coupon.analysis && (
        <div className="mt-3">
          <button onClick={()=>setShowAnalysis(!showAnalysis)} className="text-xs text-zinc-400 w-full flex justify-center items-center gap-1 hover:text-white transition">
            <Sparkles size={12} className="text-yellow-500"/> 
            {showAnalysis ? 'Analizi Gizle' : 'Yorumu Oku'} 
            {showAnalysis ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
          {showAnalysis && (
            <div className="mt-2 p-3 bg-zinc-950/80 rounded-lg border border-zinc-800/50 text-xs text-zinc-300 leading-relaxed italic animate-fade-in">
              "{coupon.analysis}"
            </div>
          )}
        </div>
      )}
      
      {/* Yorumlar ve Geri Bildirim */}
      <CommentSection couponId={coupon.id} appUser={appUser} showModal={showModal} />
      
      {/* Admin Kontrolleri */}
      {appUser?.isAdmin && (
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-800">
          <button onClick={()=>handleUpdateStatus(coupon.id, 'live')} className="text-blue-400 bg-blue-500/10 p-2 rounded hover:bg-blue-500/20" title="Canlı"><Activity size={16}/></button>
          <button onClick={()=>handleUpdateStatus(coupon.id, 'won')} className="text-emerald-400 bg-emerald-500/10 p-2 rounded hover:bg-emerald-500/20" title="Kazandı"><CheckCircle size={16}/></button>
          <button onClick={()=>handleUpdateStatus(coupon.id, 'lost')} className="text-red-400 bg-red-500/10 p-2 rounded hover:bg-red-500/20" title="Kaybetti"><XCircle size={16}/></button>
          <div className="w-px h-8 bg-zinc-800 mx-1"></div>
          <button onClick={()=>handleDeleteCoupon(coupon.id)} className="text-zinc-400 bg-zinc-800 p-2 rounded hover:bg-red-600 hover:text-white" title="Sil"><Trash2 size={16}/></button>
        </div>
      )}
    </div>
  );
};

// --- BİLEŞEN: NAVBAR ---
const Navbar = ({ user, appUser, isSidebarOpen, setIsSidebarOpen, handleLogout, deferredPrompt, handleInstallClick, coupons }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Betzade" className="w-10 h-10 rounded-lg object-contain bg-zinc-800 p-1" />
            <span className="text-xl font-bold text-white tracking-tight">BETZADE</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {deferredPrompt && <button onClick={handleInstallClick} className="flex items-center gap-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded-lg transition border border-emerald-600/30 animate-pulse"><Download className="w-4 h-4" /> <span className="text-sm font-bold">Uygulamayı Yükle</span></button>}
            <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20 px-4 py-2 rounded-full transition border border-[#229ED9]/20"><Send className="w-4 h-4" /> <span className="text-sm font-bold">Telegram</span></a>
            <div className="h-6 w-px bg-zinc-800"></div>
            <div className="relative">
              <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative p-2 text-zinc-400 hover:text-white transition group outline-none">
                <Bell className="w-5 h-5" /> {coupons.length > 0 && <><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span></>}
              </button>
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
                  <div className="p-3 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center"><h4 className="text-xs font-bold text-white flex items-center gap-2"><Bell size={12} className="text-emerald-500"/> Son Eklenenler</h4><span className="text-[10px] text-zinc-500 cursor-pointer hover:text-white" onClick={()=>setIsNotificationsOpen(false)}>Kapat</span></div>
                  <div className="max-h-80 overflow-y-auto">
                    {coupons.slice(0, 5).map(c => (
                      <div key={c.id} className="p-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition cursor-default">
                        <div className="flex justify-between items-start mb-1"><span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">YENİ KUPON</span><span className="text-[9px] text-zinc-500">Az önce</span></div>
                        <p className="text-xs text-zinc-200 font-bold mt-1">{c.title}</p>
                        <div className="flex justify-between items-center mt-1"><p className="text-[10px] text-zinc-400">Maç Sayısı: <span className="text-white font-bold">{c.matches?.length || 0}</span></p><span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">Oran: {c.totalOdds}</span></div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm"><User className="w-4 h-4" /><span>{user?.email}</span>{appUser?.isAdmin && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">YÖNETİCİ</span>}</div>
            <button onClick={handleLogout} className="text-zinc-400 hover:text-red-400 transition p-2"><LogOut className="w-5 h-5" /></button>
          </div>
          <div className="flex md:hidden items-center gap-2">
             <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center bg-[#229ED9] text-white w-8 h-8 rounded-full shadow-lg shadow-[#229ED9]/20 active:scale-95 transition"><Send size={16} /></a>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-400 p-2"><Menu /></button>
          </div>
        </div>
      </div>
      {isSidebarOpen && (
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800 p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-zinc-400 text-sm pb-3 border-b border-zinc-800"><User className="w-4 h-4" /> {user?.email}</div>
          {deferredPrompt && <button onClick={handleInstallClick} className="text-emerald-400 w-full flex items-center gap-2 font-medium bg-emerald-500/10 p-3 rounded-lg animate-pulse"><Download className="w-4 h-4" /> Uygulamayı Yükle</button>}
          <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="text-[#229ED9] w-full flex items-center gap-2 font-medium bg-[#229ED9]/10 p-3 rounded-lg"><Send className="w-4 h-4" /> Telegram Kanalı</a>
          <button onClick={handleLogout} className="text-red-400 w-full flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><LogOut className="w-4 h-4" /> Çıkış Yap</button>
        </div>
      )}
    </nav>
  );
};

// --- ANA UYGULAMA ---
export default function BetzadeApp() {
  const [user, setUser] = useState(null); 
  const [appUser, setAppUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('auth'); 
  const [coupons, setCoupons] = useState([]); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  
  // Başlangıç mesajı güncellendi
  const [chatMessages, setChatMessages] = useState([{ 
    role: 'model', 
    text: `Selam! Ben Betzade Guru 🧞‍♂️.\n\nCanlı destek, anlık bildirimler ve güncel adresimiz için Telegram kanalımıza katılın: ${TELEGRAM_LINK}\n\nAyrıca kupon veya maç analizi sorabilirsin!` 
  }]);
  
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [adminKey, setAdminKey] = useState(''); 
  const [showAdminInput, setShowAdminInput] = useState(false); 

  // Yeni Kupon State'leri
  const [couponTitle, setCouponTitle] = useState('');
  const [couponAnalysis, setCouponAnalysis] = useState('');
  const [playLink, setPlayLink] = useState(''); 
  const [tempMatches, setTempMatches] = useState([]);
  const [newMatch, setNewMatch] = useState({ homeTeam: '', awayTeam: '', league: '', prediction: '', odds: '', time: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filtreleme State'i
  const [activeTab, setActiveTab] = useState('active'); 
    
  // --- CUSTOM MODAL FONKSİYONLARI ---
  const showModal = ({ title, message, type = 'alert', onConfirm = null }) => {
      setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const hideModal = () => {
      setModal({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  };
  
  const CustomModal = () => {
    if (!modal.isOpen) return null;

    const isConfirm = modal.type === 'confirm';

    const handleAction = (confirmed) => {
        hideModal();
        if (isConfirm && confirmed && modal.onConfirm) {
            modal.onConfirm();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 animate-zoom-in">
                <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${isConfirm ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {isConfirm ? <AlertCircle size={24} /> : <Info size={24} />} {modal.title}
                </h3>
                <p className="text-zinc-300 mb-6 text-sm">{modal.message}</p>
                
                <div className="flex justify-end gap-3">
                    {isConfirm && (
                        <button 
                            onClick={() => handleAction(false)} 
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 transition"
                        >
                            İptal
                        </button>
                    )}
                    <button 
                        onClick={() => handleAction(true)} 
                        className={`px-4 py-2 text-sm font-semibold rounded-lg ${isConfirm ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white transition`}
                    >
                        {isConfirm ? 'Onayla' : 'Tamam'}
                    </button>
                </div>
            </div>
        </div>
    );
};


  // PWA
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, 'artifacts', appId, 'users', firebaseUser.uid, 'settings', 'profile');
          const userDocSnap = await getDoc(userDocRef);
          const isAdmin = userDocSnap.exists() ? userDocSnap.data().isAdmin : false;
          setAppUser({ uid: firebaseUser.uid, email: firebaseUser.email, isAdmin: isAdmin });
          // E-posta doğrulaması kaldırıldığı için direkt dashboard'a yönlendiriyoruz
          setView('dashboard'); 
        } catch (error) { 
            console.error("Kullanıcı profilini yükleme hatası:", error);
            setAppUser({ uid: firebaseUser.uid, email: firebaseUser.email, isAdmin: false }); 
        }
      } else { setUser(null); setAppUser(null); setView('auth'); }
      
      // UYARI: loading burada false olmalı ki, login ekranı veya dashboard gösterilsin.
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Veri Çekme
  useEffect(() => {
    if (!appUser) return;
    const couponsRef = collection(db, 'artifacts', appId, 'public', 'data', 'coupons');
    const q = query(couponsRef); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const couponsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        adminEmail: doc.data().adminEmail || doc.data().email 
      }));
      couponsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); 
      setCoupons(couponsData);
    }, (error) => console.error("Veri hatası:", error));
    return () => unsubscribe();
  }, [appUser]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isChatOpen]);

  // Oy sayısını artırma (upvotes veya downvotes)
  const handleVote = async (couponId, type) => {
    try { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'coupons', couponId), { 
        [type]: increment(1) 
      }); 
    } catch (err) {
      console.error("Oy kullanma hatası:", err);
      showModal({ title: "Hata", message: "Oyunuz kaydedilemedi. Lütfen tekrar deneyin." });
    }
  };

  const handleLogin = async (e) => { e.preventDefault(); setAuthError(null); try { await signInWithEmailAndPassword(auth, email, password); } catch (error) { setAuthError("E-posta veya şifre hatalı."); } };
  
  const handleRegister = async (e) => {
    e.preventDefault(); setAuthError(null);
    if (password.length < 6) { setAuthError("Şifre en az 6 karakter olmalıdır."); return; }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const profileData = { isAdmin: adminKey === 'betzade2024', email: email, createdAt: serverTimestamp() };
      await setDoc(doc(db, 'artifacts', appId, 'users', userCredential.user.uid, 'settings', 'profile'), profileData);
      // NOTE: Mail doğrulaması kaldırıldı. Kullanıcı otomatik giriş yapmış sayılır.
    } catch (error) { 
       if (error.code === 'auth/email-already-in-use') setAuthError("Bu e-posta zaten kayıtlı.");
       else setAuthError("Kayıt başarısız.");
    }
  };
  const handleLogout = async () => { await signOut(auth); setAppUser(null); setView('auth'); setEmail(''); setPassword(''); };

  const generateAICouponAnalysis = async () => {
    if (tempMatches.length === 0) { 
      showModal({ title: "Uyarı", message: "Lütfen önce kupona maç ekleyin!" }); 
      return; 
    }
    setIsGenerating(true);
    const matchesString = tempMatches.map(m => `${m.homeTeam} vs ${m.awayTeam} (${m.prediction})`).join(', ');
    const prompt = `Bu maçlardan oluşan bir futbol kuponum var: ${matchesString}. Bu kupon için kısa, heyecan verici ve motive edici Türkçe bir analiz yaz. JSON formatında sadece 'analysis' alanını döndür. Örn: {"analysis": "Yorumun..."}`;
    
    const result = await callGemini(prompt, "Sen profesyonel bir bahis yorumcususun.", showModal);
    
    if (result && result.analysis) { setCouponAnalysis(result.analysis); } else { 
      showModal({ title: "AI Hata", message: "Yapay zeka analiz üretirken bir sorun oluştu." });
    }
    setIsGenerating(false);
  };

  const addMatchToCoupon = () => {
    if (!newMatch.homeTeam || !newMatch.prediction) { 
      showModal({ title: "Uyarı", message: "En azından Takım ve Tahmin girin." }); 
      return; 
    }
    setTempMatches([...tempMatches, newMatch]);
    setNewMatch({ homeTeam: '', awayTeam: '', league: '', prediction: '', odds: '', time: '' }); 
  };

  const removeMatchFromCoupon = (index) => {
    const updated = [...tempMatches];
    updated.splice(index, 1);
    setTempMatches(updated);
  };

  const calculateTotalOdds = () => {
    if (tempMatches.length === 0) return "0.00";
    let total = 1;
    tempMatches.forEach(m => {
      const odd = parseFloat(m.odds.replace(',', '.')) || 1;
      total *= odd;
    });
    return total.toFixed(2);
  };

  const publishCoupon = async (e) => {
    e.preventDefault();
    if (tempMatches.length === 0) { 
      showModal({ title: "Uyarı", message: "Kupon boş olamaz!" }); 
      return; 
    }
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'coupons'), {
        title: couponTitle || "Günün Kuponu",
        matches: tempMatches,
        totalOdds: calculateTotalOdds(),
        analysis: couponAnalysis,
        playLink: playLink, 
        status: 'pending',
        upvotes: 0, 
        downvotes: 0, 
        createdAt: serverTimestamp(),
        adminEmail: appUser.email
      });
      setCouponTitle(''); setCouponAnalysis(''); setPlayLink(''); setTempMatches([]);
      showModal({ title: "Başarılı", message: "Kupon başarıyla paylaşıldı!" });
    } catch (err) { 
      showModal({ title: "Hata", message: "Kupon paylaşılırken bir sorun oluştu." });
      console.error("Hata: " + err.message); 
    }
  };

  // Kupon Silme (Modal kullanıldı)
  const handleDeleteCoupon = async (id) => { 
    showModal({
        title: "Onay Gerekiyor",
        message: "Bu kuponu kalıcı olarak silmek istediğinizden emin misiniz?",
        type: 'confirm',
        onConfirm: async () => {
            try { 
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'coupons', id)); 
                showModal({ title: "Başarılı", message: "Kupon silindi." });
            } catch (err) {
                showModal({ title: "Hata", message: "Kupon silinemedi. Yetki sorunu olabilir." });
                console.error("Kupon silme hatası:", err);
            }
        }
    });
  };

  const handleUpdateStatus = async (id, status) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'coupons', id), { status }); } catch (err) { console.error("Durum güncelleme hatası:", err); } };
  
  const handleChatSubmit = async (e) => { 
    e.preventDefault(); 
    if (!chatInput.trim() || isChatLoading) return; 
    
    const userMsg = { role: 'user', text: chatInput }; 
    setChatMessages(p => [...p, userMsg]); 
    setChatInput(""); 
    setIsChatLoading(true); 
    
    // showModal fonksiyonu callGeminiChat'e iletiliyor
    const aiResp = await callGeminiChat(chatMessages, userMsg.text, showModal); 
    
    setChatMessages(p => [...p, { role: 'model', text: aiResp }]); 
    setIsChatLoading(false); 
};

  const getFilteredCoupons = () => {
    if (activeTab === 'active') {
      return coupons.filter(c => c.status === 'pending' || c.status === 'live');
    } else {
      return coupons.filter(c => c.status === 'won' || c.status === 'lost');
    }
  };
  const filteredCoupons = getFilteredCoupons();

  // Adminin başarı oranını hesapla
  const adminCoupons = coupons.filter(c => c.adminEmail === appUser?.email && (c.status === 'won' || c.status === 'lost'));
  const totalAdminCoupons = adminCoupons.length;
  const wonAdminCoupons = adminCoupons.filter(c => c.status === 'won').length;
  const successRate = totalAdminCoupons > 0 ? Math.round((wonAdminCoupons / totalAdminCoupons) * 100) : 0;
  
  const totalFollowers = coupons.reduce((acc, c) => acc + (c.followers || 0), 0); 

  // --- REKLAM BANNER ---
  const Sponsors = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <a href={SPONSOR_1.link} target="_blank" rel="noopener noreferrer" className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${SPONSOR_1.color} shadow-lg transform hover:scale-[1.02] transition-all cursor-pointer group h-32`}>
        {SPONSOR_1.image && (
             <img 
                src={SPONSOR_1.image} 
                alt={SPONSOR_1.name} 
                className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" 
                // Hata alırsanız diye onError ekledim.
                onError={(e) => {e.target.onerror = null; e.target.src="https://placehold.co/400x128/1e3a8a/ffffff?text=SPONSOR+1+HATA";}}
            />
        )}
        <div className="absolute inset-0 p-4 flex flex-col justify-between relative z-10">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                 {/* Resim yoksa placeholder eklenir */}
                 <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Gem className="text-white w-6 h-6" /></div>
                 <h4 className="text-white font-bold text-lg">{SPONSOR_1.name}</h4>
             </div>
             <div className="bg-white/30 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow"></div>
           </div>
           <p className="text-white/90 text-sm font-medium"></p>
        </div>
      </a>

      <a href={SPONSOR_2.link} target="_blank" rel="noopener noreferrer" className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${SPONSOR_2.color} shadow-lg transform hover:scale-[1.02] transition-all cursor-pointer group h-32`}>
        {SPONSOR_2.image && (
             <img 
                src={SPONSOR_2.image} 
                alt={SPONSOR_2.name} 
                className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" 
                // Hata alırsanız diye onError ekledim.
                onError={(e) => {e.target.onerror = null; e.target.src="https://placehold.co/400x128/dc2626/ffffff?text=SPONSOR+2+HATA";}}
            />
        )}
        <div className="absolute inset-0 p-4 flex flex-col justify-between relative z-10">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               {/* Resim yoksa placeholder eklenir */}
               <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Gem className="text-white w-6 h-6" /></div>
               <h4 className="text-white font-bold text-lg">{SPONSOR_2.name}</h4>
             </div>
             <div className="bg-white/30 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow"></div>
           </div>
           <p className="text-white/90 text-sm font-medium"></p>
        </div>
      </a>
    </div>
  );

  const Footer = () => (
    <footer className="bg-zinc-950 border-t border-zinc-900 mt-auto py-8 w-full z-10">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex justify-center items-center gap-2 mb-4 opacity-60 hover:opacity-100 transition duration-300"><img src={LOGO_URL} alt="Betzade" className="w-6 h-6 grayscale hover:grayscale-0 transition" /><span className="text-zinc-500 font-bold tracking-wider text-sm">BETZADE</span></div>
        <div className="text-zinc-600 text-[10px] leading-relaxed max-w-xl mx-auto space-y-2">
          <p className="flex items-center justify-center gap-1 text-zinc-500"><Info className="w-3 h-3" /> <strong>YASAL UYARI</strong></p>
          <p>Betzade bir bahis sitesi değildir ve üzerinden bahis oynatılmaz. Bu platform, yapay zeka destekli algoritmalar kullanarak spor müsabakaları hakkında istatistiksel veri analizi ve tahminler sunar.</p>
          <p>Paylaşılan analizler sadece bilgi amaçlıdır. Bahis oynamak risklidir ve 18 yaş altı bireyler için uygun değildir.</p>
        </div>
        <div className="mt-6 text-zinc-700 text-[10px]">&copy; {new Date().getFullYear()} Betzade AI Analytics. Tüm hakları saklıdır.</div>
      </div>
    </footer>
  );

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-500"><Activity className="w-10 h-10 animate-spin" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden font-sans">
        {/* Arka Plan Efektleri */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="flex-grow flex items-center justify-center p-4 z-10">
          <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-8 relative">
            <div className="text-center mb-8">
              <div className="w-28 h-28 mx-auto mb-6 animate-fade-in relative"><div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl"></div><img src={LOGO_URL} alt="Betzade Logo" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" /></div>
              <h1 className="text-3xl font-bold text-white mb-1">BETZADE</h1>
              <h2 className="text-sm font-medium text-zinc-400 tracking-wider">YAPAY ZEKA DESTEKLİ ANALİZ PLATFORMU</h2>
            </div>
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {authError && <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 flex gap-3 text-red-200 text-sm items-start"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{authError}</span></div>}
              <div className="space-y-1"><label className="block text-zinc-400 text-xs font-bold ml-1">E-POSTA</label><div className="relative"><Mail className="absolute left-3 top-3 text-zinc-500 w-5 h-5" /><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition" placeholder="ornek@email.com" /></div></div>
              <div className="space-y-1"><label className="block text-zinc-400 text-xs font-bold ml-1">ŞİFRE</label><div className="relative"><Lock className="absolute left-3 top-3 text-zinc-500 w-5 h-5" /><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition" placeholder="••••••" /></div></div>
              {authMode === 'register' && (<div className="pt-2">{showAdminInput ? (<div className="relative animate-fade-in"><input type="text" value={adminKey} onChange={e=>setAdminKey(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-10 text-white focus:border-emerald-500 outline-none text-sm" placeholder="Admin Anahtarı (Opsiyonel)" /><button type="button" onClick={()=>setShowAdminInput(false)} className="absolute right-3 top-3 text-zinc-500 hover:text-white"><EyeOff className="w-4 h-4"/></button></div>) : (<button type="button" onClick={()=>setShowAdminInput(true)} className="text-xs text-zinc-600 hover:text-zinc-400 underline decoration-dotted w-full text-center transition">Yönetici misiniz?</button>)}</div>)}
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-900/20 transform active:scale-[0.98]">{authMode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</button>
            </form>
            <div className="mt-6 text-center"><button onClick={() => {setAuthMode(authMode==='login'?'register':'login'); setAuthError(null);}} className="text-zinc-400 hover:text-white text-sm transition">{authMode === 'login' ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten hesabın var mı? Giriş Yap'}</button></div>
            <div className="mt-8 pt-6 border-t border-zinc-800/50"><a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1c86b9] text-white font-bold py-3 rounded-xl transition shadow-lg shadow-[#229ED9]/20 group"><Send className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /> Telegram Sohbet Kanalı</a><p className="text-zinc-500 text-[10px] text-center mt-3">Canlı kuponlar ve sohbet için aramıza katıl!</p></div>
          </div>
        </div>
        <div className="z-10 relative"><Footer /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden font-sans">
      <Navbar 
        user={user} 
        appUser={appUser} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        handleLogout={handleLogout} 
        deferredPrompt={deferredPrompt} 
        handleInstallClick={handleInstallClick}
        coupons={coupons}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        
        {/* SPONSOR BANNERLARI */}
        <Sponsors />

        <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="w-full bg-gradient-to-r from-[#229ED9] to-[#1c86b9] rounded-xl p-4 mb-8 flex items-center justify-between shadow-lg shadow-[#229ED9]/20 group transform hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-center gap-4"><div className="bg-white/20 p-3 rounded-full backdrop-blur-sm"><Send className="w-6 h-6 text-white" /></div><div><h3 className="font-bold text-white text-lg">Betzade Telegram'a Katıl</h3><p className="text-blue-100 text-sm">Bonuslar, özel oranlar, etkinlikler ve siteler için tıkla aramıza katıl!</p></div></div>
          <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition"><ArrowRight className="w-5 h-5 text-white" /></div>
        </a>

        {/* ADMIN BAŞARI İSTATİSTİKLERİ */}
        {appUser?.isAdmin && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Layers className="w-5 h-5" /></div>
                    <div><p className="text-zinc-500 text-xs font-bold">TOPLAM KUPON</p><p className="text-xl font-bold text-white">{totalAdminCoupons}</p></div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><TrendingUp className="w-5 h-5" /></div>
                    <div><p className="text-zinc-500 text-xs font-bold">BAŞARI ORANI</p><p className="text-xl font-bold text-white">{successRate}%</p></div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Bookmark className="w-5 h-5" /></div>
                    <div><p className="text-zinc-500 text-xs font-bold">TAKİP EDİLEN</p><p className="text-xl font-bold text-white">{totalFollowers}</p></div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Gem className="w-5 h-5" /></div>
                    <div><p className="text-zinc-500 text-xs font-bold">SON KAZANÇ</p><p className="text-xl font-bold text-white text-emerald-400">YOK</p></div>
                </div>
            </div>
        )}

        {/* SEKMELER (AKTİF / SONUÇLANMIŞ) */}
        <div className="flex justify-center mb-6 gap-2">
          <button onClick={() => setActiveTab('active')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Aktif Kuponlar</button>
          <button onClick={() => setActiveTab('result')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'result' ? 'bg-zinc-700 text-white shadow-lg' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Sonuçlanmışlar</button>
        </div>

        {/* Admin Panel: Yeni Kupon Ekleme */}
        {appUser?.isAdmin && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 animate-fade-in shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800 relative z-10">
               <h2 className="text-xl font-bold flex gap-2 items-center text-white"><Layers className="text-emerald-500"/> Yeni Kupon Oluştur</h2>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Kupon Başlığı (Örn: Günün Bankosu)" value={couponTitle} onChange={e=>setCouponTitle(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition" />
                <input placeholder="Oynanacak Site Linki (Opsiyonel)" value={playLink} onChange={e=>setPlayLink(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition" />
              </div>
              <div className="flex gap-2">
                 <textarea placeholder="Kupon Analizi / Yorumu..." value={couponAnalysis} onChange={e=>setCouponAnalysis(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-emerald-500 h-24 transition" />
                 <button onClick={generateAICouponAnalysis} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition w-24">{isGenerating ? <Activity className="animate-spin w-5 h-5"/> : <><Sparkles className="w-5 h-5 text-yellow-300"/> AI YAZSIN</>}</button>
              </div>
              <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-400 mb-3">Maç Ekle</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-2">
                  <input placeholder="Ev Sahibi" value={newMatch.homeTeam} onChange={e=>setNewMatch({...newMatch, homeTeam: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-emerald-500 col-span-2" />
                  <input placeholder="Deplasman" value={newMatch.awayTeam} onChange={e=>setNewMatch({...newMatch, awayTeam: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-emerald-500 col-span-2" />
                  <input placeholder="Lig" value={newMatch.league} onChange={e=>setNewMatch({...newMatch, league: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-emerald-500" />
                  <input type="datetime-local" value={newMatch.time} onChange={e=>setNewMatch({...newMatch, time: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-emerald-500" />
                  <input placeholder="Tahmin" value={newMatch.prediction} onChange={e=>setNewMatch({...newMatch, prediction: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-emerald-500 col-span-2" />
                  <input placeholder="Oran" value={newMatch.odds} onChange={e=>setNewMatch({...newMatch, odds: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-emerald-500" />
                  <button onClick={addMatchToCoupon} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded transition col-span-3 md:col-span-1">Ekle</button>
                </div>
              </div>
              {tempMatches.length > 0 && (
                <div className="space-y-2">
                  {tempMatches.map((m, i) => (
                    <div key={i} className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800">
                      <span className="text-xs text-zinc-300">{m.homeTeam} - {m.awayTeam} <span className="text-emerald-500">({m.prediction} @ {m.odds})</span></span>
                      <button onClick={()=>removeMatchFromCoupon(i)} className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button>
                    </div>
                  ))}
                  <div className="text-right text-sm font-bold text-white mt-2">Toplam Oran: <span className="text-emerald-400">{calculateTotalOdds()}</span></div>
                </div>
              )}
              <button onClick={publishCoupon} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-emerald-900/20 transform active:scale-[0.99] mt-4">Kuponu Paylaş</button>
            </div>
          </div>
        )}

        {/* Kupon Listesi (Filtrelenmiş) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500"/> {activeTab === 'active' ? 'Aktif Kuponlar' : 'Sonuçlanmış Kuponlar'}</h2></div>
          {filteredCoupons.length === 0 ? <div className="text-center py-16 border border-zinc-800 border-dashed rounded-2xl bg-zinc-900/50"><div className="w-16 h-16 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-600"><Filter size={32}/></div><p className="text-zinc-500 font-medium">{activeTab === 'active' ? 'Şu an aktif kupon bulunmuyor.' : 'Henüz sonuçlanmış kupon yok.'}</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredCoupons.map(c => (<CouponCard key={c.id} coupon={c} appUser={appUser} handleUpdateStatus={handleUpdateStatus} handleDeleteCoupon={handleDeleteCoupon} handleVote={handleVote} showModal={showModal} />))}</div>}
        </div>
      </main>
      <Footer />
      {/* GLOBAL CUSTOM MODAL */}
      <CustomModal />
      
      <button onClick={()=>setIsChatOpen(!isChatOpen)} className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition z-50 group">{isChatOpen ? <X /> : <MessageCircle className="group-hover:animate-pulse"/>}</button>
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-fade-in-up">
           <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex items-center gap-3"><div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center"><Bot size={20}/></div><div><h3 className="font-bold text-white text-sm">Betzade Guru</h3><p className="text-xs text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Online</p></div></div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/50">
             {chatMessages.map((m,i) => (<div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}><div className={`p-3 rounded-2xl text-sm max-w-[85%] ${m.role==='user'?'bg-emerald-600 text-white rounded-br-none':'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'}`} dangerouslySetInnerHTML={{ __html: m.text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-emerald-400 underline hover:text-emerald-300">$1</a>').replace(/\n/g, '<br />') }} /></div>))}
             {isChatLoading && <div className="flex justify-start"><div className="bg-zinc-800 text-zinc-400 p-3 rounded-2xl rounded-bl-none text-xs flex gap-1"><span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-75"></span><span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-150"></span></div></div>}
             <div ref={chatEndRef}/>
           </div>
           <form onSubmit={handleChatSubmit} className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2"><input value={chatInput} onChange={e=>setChatInput(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-4 py-2 text-sm text-white outline-none focus:border-emerald-500 transition" placeholder="Maç sor..." /><button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-full transition disabled:opacity-50" disabled={!chatInput.trim() || isChatLoading}><Send size={18}/></button></form>
        </div>
      )}
    </div>
  );
}