import {
  Bath,
  Building2,
  Bus,
  Car,
  Dumbbell,
  Flower2,
  Gamepad2,
  Landmark,
  Leaf,
  Shield,
  Sparkles,
  TreePine,
  Users,
  Utensils,
  Waves,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Map a free-form amenity name (from WP) to a Lucide icon. Names come from
 * either a string (older API shape) or `{ name, icon }` where `icon` is a
 * Font Awesome class like `fa-person-swimming`.
 */
export function amenityIcon(input: string): LucideIcon {
  const key = input.toLowerCase();
  const rules: Array<[RegExp, LucideIcon]> = [
    [/pool|swim/, Waves],
    [/club/, Landmark],
    [/gym|fitness/, Dumbbell],
    [/kid|child|play/, Gamepad2],
    [/garden|land|park|green/, TreePine],
    [/yoga|spa|welln/, Sparkles],
    [/ev|charg|power/, Zap],
    [/security|cctv|guard/, Shield],
    [/park|car/, Car],
    [/bus|shuttle|transit/, Bus],
    [/wifi|internet/, Wifi],
    [/dining|restaurant|cafe/, Utensils],
    [/community|residents|meet/, Users],
    [/tower|high\s?rise|building/, Building2],
    [/eco|leaf|organic/, Leaf],
    [/bath|sauna|steam/, Bath],
    [/flower|blossom/, Flower2],
  ];
  for (const [re, Icon] of rules) if (re.test(key)) return Icon;
  return Sparkles;
}
