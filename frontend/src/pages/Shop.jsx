import { useState } from "react";
import Card from "../components/Card";
import { useGameStore } from "../store/useGameStore";
import { useTranslation } from "react-i18next";

export default function Shop() {
  const { t } = useTranslation();
  const {
    shopItems,
    inventory,
    buyItem,
    gameState,
    loadout,
    equipItem,
    settings
  } = useGameStore();
  const [showSpark, setShowSpark] = useState(false);

  const handlePurchase = (itemId) => {
    const success = buyItem(itemId);
    if (success && !settings.discreteMode) {
      setShowSpark(true);
      setTimeout(() => setShowSpark(false), 800);
    }
  };

  const slots = ["helmet", "cloak", "tool", "background", "accessory"];

  return (
    <div>
      <h1 className="page-title">{t("shop.title")}</h1>
      <p className="subtitle">{t("shop.subtitle", { gold: gameState.gold })}</p>

      <div className="grid grid-3">
        {shopItems.map((item) => {
          const owned = inventory.includes(item.id);
          const equipped = loadout[item.slot] === item.id;
          return (
            <Card key={item.id} title={item.name} subtitle={item.category}>
              <div className="shop-item-visual">
                <img src={item.assetUrl} alt={item.name} />
                {owned && <span className="badge">{t("shop.owned")}</span>}
                {equipped && <span className="badge equipped">{t("shop.equipped", { item: item.name })}</span>}
              </div>
              <div className="tag">
                {t("shop.slot")}: {item.slot}
              </div>
              <div className="tag">
                {t("shop.price")}: {item.price} {t("shop.gold")}
              </div>
              <button
                className={owned ? "button secondary" : "button"}
                onClick={() => handlePurchase(item.id)}
                disabled={owned}
              >
                {owned ? t("shop.owned") : t("shop.buy")}
              </button>
            </Card>
          );
        })}
      </div>

      {showSpark && !settings.discreteMode && (
        <div className="toast sparkle">{t("shop.purchaseForged")}</div>
      )}

      <Card
        title={t("shop.inventoryTitle")}
        subtitle={t("shop.inventorySubtitle")}
        style={{ marginTop: 24 }}
      >
        <div className="grid grid-2">
          {slots.map((slot) => {
            const equippedId = loadout[slot];
            const equippedItem = shopItems.find((item) => item.id === equippedId);
            const items = shopItems.filter(
              (item) => item.slot === slot && inventory.includes(item.id)
            );
            return (
              <div key={slot} className="inventory-slot">
                <div className="inventory-header">
                  <strong>{slot.toUpperCase()}</strong>
                  <span className="tag">
                    {t("shop.equipped", { item: equippedItem?.name || t("common.none") })}
                  </span>
                </div>
                {items.length === 0 && (
                  <p className="subtitle">{t("shop.noItems")}</p>
                )}
                <div className="inventory-grid">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={
                        equippedId === item.id
                          ? "inventory-card equipped"
                          : "inventory-card"
                      }
                    >
                      <img src={item.assetUrl} alt={item.name} />
                      <div className="inventory-details">
                        <strong>{item.name}</strong>
                        <span className="tag">
                          {equippedId === item.id
                            ? t("shop.owned")
                            : t("shop.slot")}: {slot}
                        </span>
                      </div>
                      <button
                        className="button secondary"
                        onClick={() =>
                          equipItem(slot, equippedId === item.id ? null : item.id)
                        }
                      >
                        {equippedId === item.id ? t("shop.unequip") : t("shop.equip")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
