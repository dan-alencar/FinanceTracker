import Card from "../components/Card";
import { useGameStore } from "../store/useGameStore";

export default function Shop() {
  const { shopItems, purchases, buyItem, gameState } = useGameStore();

  return (
    <div>
      <h1 className="page-title">Guild Shop</h1>
      <p className="subtitle">
        Spend your gold on cosmetics. Balance: {gameState.gold} gold.
      </p>

      <div className="grid grid-3">
        {shopItems.map((item) => {
          const owned = purchases.includes(item.id);
          return (
            <Card key={item.id} title={item.name} subtitle={item.category}>
              <img src={item.assetUrl} alt={item.name} style={{ width: "100%" }} />
              <div className="tag">Price: {item.price} gold</div>
              <button
                className={owned ? "button secondary" : "button"}
                onClick={() => buyItem(item.id)}
              >
                {owned ? "Owned" : "Buy"}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
