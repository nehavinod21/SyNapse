import {
  Bath,
  BookOpen,
  Bus,
  CheckCheck,
  Clock,
  DoorOpen,
  Frown,
  Gamepad2,
  Hand,
  HandHelping,
  Heart,
  HelpCircle,
  Home,
  MessageCircle,
  MinusCircle,
  Music,
  Octagon,
  Plus,
  School,
  Share2,
  Smile,
  SmilePlus,
  Star,
  ThumbsDown,
  ThumbsUp,
  Timer,
  Trees,
  User,
  Users,
  Utensils,
  Volume2,
  XCircle,
} from "lucide-react";

const ICON_MAP = {
  "core-i-want": HandHelping,
  "core-i": User,
  "core-want": Hand,
  "core-stop": Octagon,
  "core-more": Plus,
  "core-all-done": CheckCheck,
  "core-help": HandHelping,
  "core-my-turn": User,
  "core-your-turn": Users,
  "core-open": DoorOpen,
  "core-yes": ThumbsUp,
  "core-no": ThumbsDown,
  "core-good": Smile,
  "core-bad": Frown,
  "core-safe-hands": Hand,
  "core-be-nice": Heart,
  "core-wait": Clock,
  "core-time-for": Timer,
  "core-share": Share2,
  "core-bathroom": Bath,
  "emo-happy-1": SmilePlus,
  "emo-happy-2": Star,
  "emo-happy-3": ThumbsUp,
  "emo-happy-4": Plus,
  "emo-sad-1": Frown,
  "emo-sad-2": Heart,
  "emo-sad-3": Heart,
  "emo-sad-4": Clock,
  "emo-angry-2": MinusCircle,
  "emo-angry-3": Volume2,
  "emo-angry-4": XCircle,
  "emo-fear-2": Home,
  "emo-fear-3": Users,
  "emo-fear-4": HelpCircle,
  "emo-surprise-1": Star,
  "emo-surprise-2": HelpCircle,
  "emo-surprise-3": Plus,
  "emo-surprise-4": MessageCircle,
  "emo-disgust-1": ThumbsDown,
  "emo-disgust-2": XCircle,
  "emo-disgust-3": Hand,
  "emo-disgust-4": ThumbsDown,
  "emo-neutral-1": Smile,
  "emo-neutral-2": HelpCircle,
  "emo-neutral-3": MessageCircle,
  "emo-neutral-4": Clock,
  "sch-1": User,
  "sch-2": Users,
  "sch-3": BookOpen,
  "sch-4": Plus,
  "sch-5": Trees,
  "sch-6": School,
  "sch-7": BookOpen,
  "sch-8": Bus,
  "home-1": User,
  "home-2": User,
  "home-3": Clock,
  "home-4": Utensils,
  "home-5": Volume2,
  "home-6": Bath,
  "home-7": Users,
  "home-8": Clock,
  "feel-5": Clock,
  "feel-6": Star,
  "feel-7": Smile,
  "feel-8": Heart,
  "play-1": Gamepad2,
  "play-2": Gamepad2,
  "play-3": Trees,
  "play-4": Trees,
  "play-5": Hand,
  "play-6": Gamepad2,
  "play-7": BookOpen,
  "play-8": Music,
  "food-1": Utensils,
  "food-2": Utensils,
  "food-3": Utensils,
  "food-4": Utensils,
  "food-5": Utensils,
  "food-6": Utensils,
  "food-7": Utensils,
  "food-8": Smile,
  "body-1": User,
  "body-2": Hand,
  "body-3": Heart,
  "body-4": Hand,
  "body-5": Bath,
  "body-6": HelpCircle,
  "body-7": Plus,
  "body-8": User,
};

const LABEL_HINTS = [
  [/help|مساعدة/i, HandHelping],
  [/stop|توقف/i, Octagon],
  [/yes|نعم/i, ThumbsUp],
  [/no|لا/i, ThumbsDown],
  [/more|المزيد/i, Plus],
  [/done|انتهى/i, CheckCheck],
  [/wait|انتظر/i, Clock],
  [/share|شارك/i, Share2],
  [/bathroom|حمام|toilet/i, Bath],
  [/school|مدرسة/i, School],
  [/home|منزل/i, Home],
  [/food|طعام|eat|أكل/i, Utensils],
  [/play|لعب/i, Gamepad2],
];

const CATEGORY_COLORS = {
  core: "text-amber-600",
  emotion: "text-rose-600",
  topic: "text-emerald-700",
};

export default function AACIcon({ card, size = 56 }) {
  if (card?.emoji) {
    return (
      <span
        className="aac-card-icon leading-none select-none"
        style={{ fontSize: Math.round(size * 0.9), lineHeight: 1 }}
        aria-hidden
      >
        {card.emoji}
      </span>
    );
  }

  const Icon =
    ICON_MAP[card?.id] ||
    LABEL_HINTS.find(([re]) => re.test(card?.label || "") || re.test(card?.label_ar || ""))?.[1] ||
    MessageCircle;

  const color = CATEGORY_COLORS[card?.category] || "text-slate-700";

  return (
    <Icon
      className={`aac-card-icon ${color}`}
      size={size}
      strokeWidth={2.25}
      aria-hidden
    />
  );
}
