import { useState } from "react";
import Card from "../components/Card";
import { useGameStore } from "../store/useGameStore";

export default function Shop() {
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
      <h1 className="page-title">Armory</h1>
      <p className="subtitle">
        Spend your gold on cosmetics. Balance: {gameState.gold} gold.
      </p>

      <div className="grid grid-3">
        {shopItems.map((item) => {
          const owned = inventory.includes(item.id);
          return (
            <Card key={item.id} title={item.name} subtitle={item.category}>
              <img src={item.assetUrl} alt={item.name} style={{ width: "100%" }} />
              <div className="tag">Slot: {item.slot}</div>
              <div className="tag">Price: {item.price} gold</div>
              <button
                className={owned ? "button secondary" : "button"}
                onClick={() => handlePurchase(item.id)}
              >
                {owned ? "Owned" : "Buy"}
              </button>
            </Card>
          );
        })}
      </div>

      {showSpark && !settings.discreteMode && (
        <div className="toast sparkle">Purchase forged!</div>
      )}

      <Card
        title="Inventory & Loadout"
        subtitle="Equip cosmetics by slot"
        style={{ marginTop: 24 }}
      >
        <div className="grid grid-2">
          {slots.map((slot) => {
            const equippedId = loadout[slot];
            const items = shopItems.filter(
              (item) => item.slot === slot && inventory.includes(item.id)
            );
            return (
              <div key={slot} className="inventory-slot">
                <div className="inventory-header">
                  <strong>{slot.toUpperCase()}</strong>
                  <span className="tag">
                    Equipped: {equippedId || "None"}
                  </span>
                </div>
                {items.length === 0 && (
                  <p className="subtitle">No items yet. Visit the armory.</p>
                )}
                <div className="list">
                  {items.map((item) => (
                    <div key={item.id} className="tag inventory-item">
                      {item.name}
                      <button
                        className="button secondary"
                        onClick={() =>
                          equipItem(slot, equippedId === item.id ? null : item.id)
                        }
                      >
                        {equippedId === item.id ? "Unequip" : "Equip"}
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
