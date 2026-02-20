import React from "react";

export const PrintTicket = ({ order }) => {
  if (!order) return null;

  return (
    <div
      style={{
        width: "80mm",
        padding: "5mm",
        backgroundColor: "white",
        color: "black",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          textAlign: "center",
          borderBottom: "1px dashed black",
          paddingBottom: "10px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
          STATUS ΚΟΥΖΙΝΑ
        </h2>
        <p style={{ margin: "5px 0", fontSize: "10px" }}>
          {new Date(order.created_at).toLocaleString("el-GR")}
        </p>
      </div>

      <div style={{ textAlign: "center", margin: "15px 0" }}>
        <h1 style={{ fontSize: "32px", margin: 0, fontWeight: "900" }}>
          {order.table_number}
        </h1>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        {order.items.map((item, i) => (
          <tr key={i} style={{ fontSize: "16px", fontWeight: "bold" }}>
            <td style={{ padding: "5px 0" }}>• {item.name}</td>
            <td style={{ textAlign: "right" }}>1x</td>
          </tr>
        ))}
      </table>

      <div
        style={{
          borderTop: "2px solid black",
          marginTop: "15px",
          paddingTop: "10px",
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
            marginTop: "10px",
            fontSize: "14px",
            fontWeight: "bold",
            textAlign: "center",
            border: "1px solid black",
            padding: "5px",
          }}
        >
          ΠΛΗΡΩΜΗ: {order.payment_method}
        </div>
      </div>
    </div>
  );
};
