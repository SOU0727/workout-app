export const groupKeywords = {
  "胸": ["pectoralis"],
  "背中": ["latissimus_dorsi", "trapezius", "rhomboid", "teres_major", "teres_minor"],
  "肩": ["deltoid"],
  "二頭筋": ["biceps_brachii"],
  "三頭筋": ["triceps_brachii"],
  "前腕": ["brachioradialis", "pronator", "supinator", "carpi"],
  "腹筋": ["rectus_abdominis", "abdominal_oblique", "transversus_abdominis"],
  "脚": ["rectus_femoris", "vastus", "biceps_femoris", "semitendinosus", "semimembranosus", "gastrocnemius", "soleus", "gluteus", "sartorius"],
};

export const dataGroupMap = {
  "胸": "胸",
  "背中": "背中",
  "肩": "肩",
  "二頭筋": "腕",
  "三頭筋": "腕",
  "前腕": "腕",
  "腹筋": "体幹",
  "脚": "脚",
};

export function classifyMesh(name) {
  const lower = name.toLowerCase();
  for (const [group, keywords] of Object.entries(groupKeywords)) {
    if (keywords.some((k) => lower.includes(k))) return group;
  }
  return null;
}
