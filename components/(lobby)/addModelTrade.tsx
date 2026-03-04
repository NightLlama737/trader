"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AddModelTrade() {
  const searchParams = useSearchParams();
  const s3Key = searchParams.get("s3Key");
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);

  const handleSubmit = async () => {
    if (!s3Key) return alert("Missing S3 key!");

    try {
      const res = await fetch("/api/offModelTrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          s3Key,
          name,
          description,
          price,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Model added to trade!");
        router.push("/lobby");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  const inputStyle = {
    outline: "none",
    color: "lightgreen",
    paddingLeft: "10px",
    border: "none",
    caretColor: "lightgreen",
    width: "70%",
    backgroundColor: "black",
    fontFamily: "monospace",
    marginBottom: "10px",
  };

  const buttonStyle = {
    marginTop: "10px",
    height: "40px",
    borderRadius: "5px",
    color: "green",
    border: "none",
    width: "40%",
    backgroundColor: "black",
    fontFamily: "monospace",
    cursor: "pointer",
    transition: "color 0.3s",
  };

  return (
    <div
      style={{
        color: "white",
        display: "flex",
        alignItems: "center",
        width: "500px",
        flexDirection: "column",
        gap: "10px",
        padding: "20px",
      }}
    >
      <h2 style={{ color: "green", fontFamily: "monospace" }}>
        Add Model to Trade
      </h2>

      <label style={{ width: "100%", color: "green" }}>
        Name:
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
         
        />
      </label>

      <label style={{ width: "100%", color: "green" }}>
        Description:
        <input
          style={inputStyle}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
         
        />
      </label>

      <label style={{ width: "100%", color: "green" }}>
        Price:
        <input
          style={inputStyle}
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
         
         
        />
      </label>

      <button
        style={buttonStyle}
        onMouseEnter={(e) => (e.currentTarget.style.color = "lightgreen")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "green")}
        onClick={handleSubmit}
      >
        <h2>[ Submit ]</h2>
      </button>
    </div>
  );
}
