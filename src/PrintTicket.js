import React from "react";

export const PrintTicket = ({ order }) => {
  if (!order) return null;

  return (
    <div
      style={{
        width: "80mm",
        padding: "0px", // Μηδενισμός κενού για οικονομία χαρτιού
        backgroundColor: "white",
        color: "black",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          textAlign: "center",
          borderBottom: "1px dashed black",
          paddingBottom: "8px",
          marginTop: "0px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
          STATUS
        </h2>
        {/* Η ΩΡΑ ΜΕΓΑΛΩΣΕ ΕΔΩ */}
        <p style={{ margin: "5px 0", fontSize: "14px", fontWeight: "bold" }}>
          {new Date(order.created_at).toLocaleString("el-GR")}
        </p>
      </div>

      <div style={{ textAlign: "center", margin: "10px 0" }}>
        <h1 style={{ fontSize: "40px", margin: 0, fontWeight: "900" }}>
          {order.table_number}
        </h1>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i} style={{ fontSize: "18px", fontWeight: "bold" }}>
              <td style={{ padding: "4px 0" }}>• {item.name}</td>
              <td style={{ textAlign: "right" }}>{item.quantity || 1}x</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          borderTop: "2px solid black",
          marginTop: "10px",
          paddingTop: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          <span>ΣΥΝΟΛΟ:</span>
          <span>{order.total_price.toFixed(2)}€</span>
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "14px",
            fontWeight: "bold",
            textAlign: "center",
            border: "1px solid black",
            padding: "4px",
          }}
        >
          ΠΛΗΡΩΜΗ: {order.payment_method}
        </div>
      </div>
    </div>
  );
};
