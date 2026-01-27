import { useTranslation } from "react-i18next";

const baseFallback = "/assets/avatars/base/default.svg";
const appearanceMap = {
  ember: "/assets/avatars/backgrounds/ember.svg",
  crystal: "/assets/avatars/backgrounds/crystal.svg",
  shadow: "/assets/avatars/backgrounds/shadow.svg",
  moss: "/assets/avatars/backgrounds/moss.svg",
  starlit: "/assets/avatars/backgrounds/starlit.svg"
};

export default function AvatarRenderer({
  classKey = "forge-guardian",
  appearanceId = "ember",
  equipped = {},
  discreteMode = false
}) {
  const { t } = useTranslation();
  const backgroundSrc = equipped.background || appearanceMap[appearanceId] || appearanceMap.ember;
  const baseSrc = classKey
    ? `/assets/avatars/base/${classKey}.svg`
    : baseFallback;

  const layers = [
    {
      key: "background",
      src: backgroundSrc,
      alt: t("avatar.background")
    },
    {
      key: "base",
      src: baseSrc,
      alt: t("avatar.base")
    },
    { key: "helmet", src: equipped.helmet, alt: t("avatar.helmet") },
    { key: "cloak", src: equipped.cloak, alt: t("avatar.cloak") },
    { key: "tool", src: equipped.tool, alt: t("avatar.tool") },
    { key: "accessory", src: equipped.accessory, alt: t("avatar.accessory") }
  ];

  return (
    <div
      className={
        discreteMode ? "avatar-renderer discrete" : "avatar-renderer"
      }
    >
      {layers.map((layer) =>
        layer.src ? (
          <img
            key={layer.key}
            src={layer.src}
            alt={layer.alt}
            className={`avatar-layer avatar-${layer.key}`}
            onError={(event) => {
              if (layer.key === "base") {
                event.currentTarget.src = baseFallback;
              } else if (layer.key === "background") {
                event.currentTarget.src = appearanceMap.ember;
              } else {
                event.currentTarget.style.display = "none";
              }
            }}
          />
        ) : null
      )}
    </div>
  );
}
