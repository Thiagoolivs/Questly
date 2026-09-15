import React from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  BellOff,
  Bike,
  Calendar,
  CalendarDays,
  CalendarPlus,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Clock,
  Copy,
  Droplet,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  HelpCircle,
  House,
  Image,
  Info,
  Leaf,
  ListCheck,
  ListTodo,
  Lightbulb,
  Loader,
  Lock,
  LogOut,
  MessageCircle,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Star,
  Sun,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  Users,
  Utensils,
  Wand2,
  X,
  Zap,
} from "lucide-react";

/* Lucide stands in for LGrow's icon set — the source case study shipped no icon
   files. Os glifos vêm do pacote (bundle local), não de CDN: o Questly é um PWA
   e os ícones precisam aparecer offline.

   O registro é explícito de propósito: `import * as lucide` arrasta os ~1500
   ícones para o bundle (≈1 MB). Ícone novo na tela ⇒ acrescente aqui. */
const ICONS = {
  activity: Activity,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  bell: Bell,
  "bell-off": BellOff,
  bike: Bike,
  bulb: Lightbulb,
  calendar: Calendar,
  "calendar-days": CalendarDays,
  "calendar-plus": CalendarPlus,
  camera: Camera,
  check: Check,
  "check-circle": CheckCircle,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "clipboard-list": ClipboardList,
  clock: Clock,
  copy: Copy,
  droplet: Droplet,
  dumbbell: Dumbbell,
  flame: Flame,
  footprints: Footprints,
  heart: Heart,
  "help-circle": HelpCircle,
  house: House,
  image: Image,
  info: Info,
  leaf: Leaf,
  "list-check": ListCheck,
  "list-todo": ListTodo,
  loader: Loader,
  lock: Lock,
  "log-out": LogOut,
  "message-circle": MessageCircle,
  "message-square": MessageSquare,
  moon: Moon,
  "more-horizontal": MoreHorizontal,
  pencil: Pencil,
  play: Play,
  plus: Plus,
  "refresh-cw": RefreshCw,
  repeat: Repeat,
  search: Search,
  send: Send,
  settings: Settings,
  share: Share2,
  shield: Shield,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  target: Target,
  timer: Timer,
  trash: Trash2,
  "trending-up": TrendingUp,
  trophy: Trophy,
  user: User,
  users: Users,
  utensils: Utensils,
  wand: Wand2,
  x: X,
  zap: Zap,
};

export default function Icon({ name, size = 20, color = "currentColor", style, ...rest }) {
  const Glyph = ICONS[name];

  // Nome desconhecido não pode derrubar a tela: reserva o espaço e segue.
  if (!Glyph) {
    if (import.meta.env?.DEV) console.warn(`[Icon] ícone não registrado: "${name}"`);
    return (
      <span
        aria-hidden="true"
        {...rest}
        style={{ display: "inline-block", width: size, height: size, flex: "none", ...style }}
      />
    );
  }

  return (
    <Glyph
      aria-hidden="true"
      {...rest}
      size={size}
      color={color}
      style={{ flex: "none", ...style }}
    />
  );
}

export const ICON_NAMES = Object.keys(ICONS);
