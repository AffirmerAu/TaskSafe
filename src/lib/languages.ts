export type Lang = {
  code: string;
  native: string;
  rtl: boolean;
  heading: string;
  lead: string;
  btn: string;
};

export const LANGS: Lang[] = [
  {
    code: "en",
    native: "English",
    rtl: false,
    heading: "You are invited to complete your safety induction",
    lead: "Before you start on site, Coastline Civil needs you to complete a short induction. It is video-led and takes about <b>18 minutes</b>.",
    btn: "Start training",
  },
  {
    code: "zh",
    native: "中文",
    rtl: false,
    heading: "您被邀请完成安全入职培训",
    lead: "在开始工地工作之前，Coastline Civil 要求您完成一个简短的培训。以视频为主，约 <b>18 分钟</b>。",
    btn: "开始培训",
  },
  {
    code: "vi",
    native: "Tiếng Việt",
    rtl: false,
    heading: "Bạn được mời hoàn thành bài huấn luyện an toàn",
    lead: "Trước khi bắt đầu làm việc, Coastline Civil yêu cầu bạn hoàn thành một bài huấn luyện ngắn. Theo video, khoảng <b>18 phút</b>.",
    btn: "Bắt đầu",
  },
  {
    code: "ar",
    native: "العربية",
    rtl: true,
    heading: "أنت مدعو لإتمام تدريب السلامة",
    lead: "قبل البدء في الموقع، تحتاج Coastline Civil منك إتمام تدريب قصير بالفيديو، يستغرق حوالي <b>18 دقيقة</b>.",
    btn: "ابدأ التدريب",
  },
  {
    code: "es",
    native: "Español",
    rtl: false,
    heading: "Estás invitado a completar tu inducción de seguridad",
    lead: "Antes de comenzar en el sitio, Coastline Civil necesita que completes una inducción corta en video. Toma unos <b>18 minutos</b>.",
    btn: "Comenzar",
  },
  {
    code: "tl",
    native: "Tagalog",
    rtl: false,
    heading: "Inimbitahan kang kumpletuhin ang iyong safety induction",
    lead: "Bago ka magsimula sa site, kailangan mong kumpletuhin ang isang maikling induction. Video-based ito, mga <b>18 minuto</b>.",
    btn: "Simulan",
  },
  {
    code: "pa",
    native: "ਪੰਜਾਬੀ",
    rtl: false,
    heading: "ਤੁਹਾਨੂੰ ਸੁਰੱਖਿਆ ਇੰਡਕਸ਼ਨ ਪੂਰੀ ਕਰਨ ਲਈ ਸੱਦਾ ਦਿੱਤਾ ਗਿਆ ਹੈ",
    lead: "ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ, Coastline Civil ਤੁਹਾਨੂੰ ਇੱਕ ਛੋਟੀ ਇੰਡਕਸ਼ਨ ਪੂਰੀ ਕਰਨ ਲਈ ਕਹਿੰਦਾ ਹੈ। ਵੀਡੀਓ-ਆਧਾਰਿਤ, ਲਗਭਗ <b>18 ਮਿੰਟ</b>।",
    btn: "ਸ਼ੁਰੂ ਕਰੋ",
  },
  {
    code: "hi",
    native: "हिन्दी",
    rtl: false,
    heading: "आपको सुरक्षा इंडक्शन पूरी करने के लिए आमंत्रित किया गया है",
    lead: "साइट पर शुरू करने से पहले Coastline Civil को आपकी एक छोटी इंडक्शन चाहिए। यह वीडियो-आधारित है, लगभग <b>18 मिनट</b>।",
    btn: "शुरू करें",
  },
];
