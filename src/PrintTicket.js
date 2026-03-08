import React from "react";

export const PrintTicket = ({ order }) => {
  if (!order) return null;

  return (
    <div
      style={{
        width: "80mm",
        padding: "0px",
        margin: "0px",
        backgroundColor: "white",
        color: "black",
        fontFamily: "monospace",
        lineHeight: "1.1", // Μειώνει το κενό ανάμεσα σε όλες τις γραμμές
      }}
    >
      {/* 1. HEADER: ΤΡΑΠΕΖΙ & ΩΡΑ ΣΤΗΝ ΙΔΙΑ ΓΡΑΜΜΗ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderBottom: "2px dashed black",
          paddingBottom: "4px",
          marginBottom: "4px",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
            STATUS
          </h2>
          <h1
            style={{
              margin: 0,
              fontSize: "36px",
              fontWeight: "900",
              lineHeight: "1",
            }}
          >
            #{order.table_number}
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: "16px", fontWeight: "900" }}>
            {new Date(order.created_at).toLocaleString("el-GR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      {/* 2. ΠΡΟΪΟΝΤΑ & ΣΗΜΕΙΩΣΕΙΣ (Χωρίς περιττά κενά) */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {order.items.map((item, i) => (
            <tr
              key={i}
              style={{ borderBottom: item.note ? "1px dotted #ccc" : "none" }}
            >
              <td style={{ padding: "2px 0", verticalAlign: "top" }}>
                <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                  • {item.name}
                </span>
                {/* Η σημείωση μπήκε ΑΚΡΙΒΩΣ κάτω από το προϊόν, στο ίδιο κελί */}
                {item.note && (
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "900",
                      fontStyle: "italic",
                      marginTop: "1px",
                    }}
                  >
                    👉 ΣΗΜ: {item.note}
                  </div>
                )}
              </td>
              <td
                style={{
                  textAlign: "right",
                  verticalAlign: "top",
                  paddingTop: "2px",
                  fontSize: "20px",
                  fontWeight: "bold",
                  minWidth: "30px",
                }}
              >
                {item.quantity || 1}x
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 3. ΓΕΝΙΚΗ ΣΗΜΕΙΩΣΗ (Πιο συμπαγής) */}
      {order.general_note && (
        <div
          style={{
            border: "2px solid black",
            padding: "2px 4px",
            marginTop: "4px",
            fontSize: "16px",
            fontWeight: "900",
          }}
        >
          <span style={{ textDecoration: "underline" }}>ΓΕΝ. ΣΗΜ:</span>{" "}
          {order.general_note}
        </div>
      )}

      {/* 4. FOOTER: ΣΥΝΟΛΟ ΚΑΙ ΠΛΗΡΩΜΗ ΣΕ 1 ΓΡΑΜΜΗ */}
      <div
        style={{
          borderTop: "2px solid black",
          marginTop: "4px",
          paddingTop: "4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: "bold" }}>
          ΠΛΗΡΩΜΗ:{" "}
          <span style={{ fontSize: "16px", fontWeight: "900" }}>
            {order.payment_method}
          </span>
        </div>
        <div style={{ fontSize: "16px", fontWeight: "bold" }}>
          ΣΥΝ:{" "}
          <span style={{ fontSize: "20px", fontWeight: "900" }}>
            {order.total_price.toFixed(2)}€
          </span>
        </div>
      </div>

      {/* LOYALTY (Μικρότερο margin) */}
      {order.is_loyalty_reward && (
        <div
          style={{
            marginTop: "4px",
            border: "2px solid black",
            textAlign: "center",
            fontWeight: "bold",
            padding: "2px",
          }}
        >
          🎁 ΔΩΡΟ LOYALTY 🎁
        </div>
      )}
    </div>
  );
};
