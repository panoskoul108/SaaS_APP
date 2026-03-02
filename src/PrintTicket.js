import React from "react";

export const PrintTicket = ({ order }) => {
  if (!order) return null;

  return (
    <div
      style={{
        width: "100%",
        padding: "0px",
        margin: "0px", // Μηδενισμός εξωτερικού κενού
        color: "#000",
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.1",
      }}
    >
      {/* ΤΡΑΠΕΖΙ - ΣΥΜΠΥΚΝΩΜΕΝΟ ΠΑΝΩ ΜΕΡΟΣ */}
      <div style={{ 
        textAlign: "center", 
        borderBottom: "2px solid #000", 
        paddingBottom: "5px", 
        marginBottom: "8px",
        marginTop: "-10px" // Τραβάει το κείμενο ακόμα πιο πάνω
      }}>
        <h1 style={{ fontSize: "35px", margin: "0", fontWeight: "900" }}>
          ΤΡ: {order.table_number}
        </h1>
        <div style={{ fontSize: "12px", fontWeight: "bold" }}>
          {new Date(order.created_at).toLocaleTimeString("el-GR")}
        </div>
      </div>

      {/* ΛΙΣΤΑ ΠΡΟΪΟΝΤΩΝ - ΕΔΩ ΕΙΝΑΙ Η ΜΕΓΑΛΗ ΓΡΑΜΜΑΤΟΣΕΙΡΑ */}
      <div style={{ marginBottom: "5px" }}>
        {order.items?.map((item, index) => (
          <div key={index} style={{ marginBottom: "8px", borderBottom: "1px solid #ccc", paddingBottom: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <span style={{ 
                fontSize: "28px", // ΠΟΛΥ ΜΕΓΑΛΟ ΓΙΑ ΤΑ ΠΡΟΪΟΝΤΑ
                fontWeight: "900", 
                textTransform: "uppercase", 
                flex: "1",
                lineHeight: "1"
              }}>
                {item.quantity}x {item.name}
              </span>
            </div>
            
            {/* ΣΗΜΕΙΩΣΗ ΠΡΟΪΟΝΤΟΣ */}
            {item.note && (
              <div style={{ 
                fontSize: "18px", 
                fontWeight: "900", 
                fontStyle: "italic", 
                marginTop: "2px",
                padding: "2px",
                border: "1px solid #000" // Πλαίσιο για να μην χάνεται η σημείωση
              }}>
                ΣΗΜ: {item.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ΓΕΝΙΚΗ ΣΗΜΕΙΩΣΗ */}
      {order.general_note && (
        <div style={{ border: "1px solid #000", padding: "4px", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "900", display: "block" }}>ΓΕΝΙΚΗ ΣΗΜΕΙΩΣΗ:</span>
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>{order.general_note}</span>
        </div>
      )}

      {/* ΣΥΝΟΛΟ & ΠΛΗΡΩΜΗ - ΠΙΟ ΜΙΚΡΑ ΓΙΑ ΟΙΚΟΝΟΜΙΑ ΧΑΡΤΙΟΥ */}
      <div style={{ borderTop: "1px dashed #000", paddingTop: "5px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "16px", fontWeight: "bold" }}>ΣΥΝΟΛΟ:</span>
          <span style={{ fontSize: "24px", fontWeight: "900" }}>{order.total_price?.toFixed(2)}€</span>
        </div>
        <div style={{ fontSize: "12px", textAlign: "right", fontWeight: "bold", marginTop: "2px" }}>
          ΠΛΗΡΩΜΗ: {order.payment_method}
        </div>
      </div>

      {/* LOYALTY ΕΙΔΟΠΟΙΗΣΗ */}
      {order.is_loyalty_reward && (
        <div style={{ 
          marginTop: "8px", 
          padding: "5px", 
          border: "2px solid #000", 
          textAlign: "center" 
        }}>
          <span style={{ fontSize: "16px", fontWeight: "900" }}>🎁 ΔΩΡΟ LOYALTY 🎁</span>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "10px", fontSize: "10px" }}>
        --- ΤΕΛΟΣ ΠΑΡΑΓΓΕΛΙΑΣ ---
      </div>
    </div>
  );
};